using Amazon.Runtime;
using Amazon.S3;
using DinkToPdf;
using DinkToPdf.Contracts;
using Hangfire;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Minio;
using NLog;
using NLog.Web;
using Quartz;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Persistence.Repositories;
using SigningPortal.Core.Security;
using SigningPortal.Core.Services;
using SigningPortal.Core.Sheduler;
using SigningPortal.Core.Utilities;
using SigningPortal.Web.Attributes;
using SigningPortal.Web.Extensions;
using SigningPortal.Web.Middlewares;
using SigningPortal.Web.Utilities;
using StackExchange.Redis;
using System.Text.Json;
using VaultSharp;
using VaultSharp.V1.AuthMethods.Token;
using GlobalConfiguration = SigningPortal.Core.Utilities.GlobalConfiguration;
using IGlobalConfiguration = SigningPortal.Core.Utilities.IGlobalConfiguration;
using Monitor = SigningPortal.Core.Utilities.Monitor;

var logger = LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();
logger.Info("Init main");

try
{
    var builder = WebApplication.CreateBuilder(args);

    var securityConfig = builder.Configuration
                          .GetSection("SecurityConfig")
                          .Get<SecurityConfig>();

    // Call each setup function only if the feature is enabled
    if (securityConfig?.UseRateLimiting == true)
        SigningPortal.Web.Extensions.WebHostExtensions.ConfigureRateLimiting(builder.Services, securityConfig, logger);

    if (securityConfig?.UseKestrelSettings == true)
        SigningPortal.Web.Extensions.WebHostExtensions.ConfigureKestrel(builder.WebHost, securityConfig, logger);

    await ConfigureServices(builder);

    //builder.Configuration.AddIniFile($"settings.{builder.Environment.EnvironmentName}", true, false);
    builder.Logging.ClearProviders();
    builder.Logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Information);

    builder.Host.UseNLog();

    builder.Services.AddControllersWithViews();

    builder.Services.Configure<FormOptions>(options =>
    {
        options.MultipartBodyLengthLimit = 512 * 1024 * 1024; // 500 MB
    });


    builder.Services.Configure<KestrelServerOptions>(options =>
    {
        options.Limits.MaxRequestBodySize = 200 * 1024 * 1024; // Set the appropriate value in bytes
    });

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Signing Portal API",
            Version = "v1",
            Description = "API Documentation including External APIs"
        });

        //// Include External API via OpenAPI Spec
        //c.AddServer(new OpenApiServer
        //{
        //	Url = "https://externalapi.example.com",
        //	Description = "External API"
        //});

        //// Optional: Enable XML comments for better documentation
        //var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        //var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        //c.IncludeXmlComments(xmlPath);
    });

    var app = builder.Build();

    logger.Info("WebApplication build successful");

    // For Proxy Servers
    string? basePath = builder.Configuration["BasePath"];
    if (!string.IsNullOrEmpty(basePath))
    {
        app.Use(async (context, next) =>
        {
            context.Request.PathBase = basePath;
            await next.Invoke();
        });
    }

    if (securityConfig?.UseSecurityHeaders == true)
        SigningPortal.Web.Extensions.WebHostExtensions.ConfigureSecurityHeaders(app, securityConfig, logger);


    // Enable Swagger & UI in Development Mode
    if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "SigningPortalExternalAPI");
        });

        // Enable ReDoc
        app.UseReDoc(c =>
        {
            c.RoutePrefix = "redoc";  // Access via /redoc
            c.DocumentTitle = "API Documentation";
            c.SpecUrl("/swagger/v1/swagger.json");
            c.ExpandResponses("200,201");
            c.HideDownloadButton();
        });
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
        app.UseForwardedHeaders();
        // app.UseBrowserLink();
    }
    else
    {
        app.UseExceptionHandler("/Error");

        app.UseStatusCodePagesWithReExecute("/Error/{0}");
        app.UseForwardedHeaders();

        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        //app.UseHsts();
    }

    app.UseMiddleware<PrecompressedFileMiddleware>();

    var provider = new FileExtensionContentTypeProvider();
    // Add new MIME type mappings
    provider.Mappings[".res"] = "application/octet-stream";
    provider.Mappings[".pexe"] = "application/x-pnacl";
    provider.Mappings[".nmf"] = "application/octet-stream";
    provider.Mappings[".mem"] = "application/octet-stream";
    provider.Mappings[".wasm"] = "application/wasm";

    provider.Mappings[".js.gz"] = "application/javascript";

    app.UseStaticFiles(new StaticFileOptions
    {
        ContentTypeProvider = provider,
        OnPrepareResponse = ctx =>
        {
            var path = ctx.File.PhysicalPath?.ToLowerInvariant();
            if (path == null) return;

            string[] longCacheExtensions =
                {
                ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
                ".woff", ".woff2", ".ttf", ".eot", ".js.gz", ".css.gz"
            };

            if (longCacheExtensions.Any(ext => path.EndsWith(ext)))
            {
                // Cache for 1 year (immutable if versioned/fingerprinted)
                ctx.Context.Response.Headers.Append(
                    "Cache-Control", "public,max-age=31536000,immutable");
            }
            else
            {
                // Shorter cache (1 hour) for other static files
                ctx.Context.Response.Headers.Append(
                    "Cache-Control", "public,max-age=3600");
            }
        }
    });

    app.UseRouting();

    app.UseSession();

    app.UseCookiePolicy();

    app.UseAuthentication();

    app.UseAuthorization();

    //app.UseHangfireDashboard();  //Hangfire

    app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Login}/{action=Index}/{id?}");

    app.MapControllers();
    app.MapHub<NotificationHub>("/pushNotification").AllowAnonymous();

    app.Run();
}
catch (Exception ex)
{
    // NLog: catch setup errors
    logger.Error(ex, ex.Message);
    throw;
}
finally
{
    // Ensure to flush and stop internal timers/threads before application-exit (Avoid segmentation fault on Linux)
    LogManager.Shutdown();
}

async Task ConfigureServices(WebApplicationBuilder builder)
{
    builder.Services.AddQuartz(q =>
    {
        q.UseMicrosoftDependencyInjectionJobFactory();

        var jobKey = new JobKey("CheckDocumentExpiryAndCleanNotification");
        q.AddJob<CheckDocumentExpiryAndCleanNotification>(opts => opts.WithIdentity(jobKey));
        // Trigger for 12:00 AM
        q.AddTrigger(opts => opts
            .ForJob(jobKey)
            .WithIdentity("CheckDocumentExpiryAndCleanNotification-trigger")
            .WithCronSchedule("0 0 0 * * ?")); // 12:00 AM every day

        var SigningReminderJobKey = new JobKey("SigningReminder");
        q.AddJob<SigningReminder>(opts => opts.WithIdentity(SigningReminderJobKey));
        // Trigger for 12:00 AM
        q.AddTrigger(opts => opts
            .ForJob(SigningReminderJobKey)
            .WithIdentity("SigningReminder-trigger-12am")
            .WithCronSchedule("0 0 0 * * ?")); // 12:00 AM every day

        // Trigger for 12:00 PM
        q.AddTrigger(opts => opts
            .ForJob(SigningReminderJobKey)
            .WithIdentity("SigningReminder-trigger-12pm")
            .WithCronSchedule("0 0 12 * * ?")); // 12:00 PM every day
    });

    builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);
    // builder.Services.AddHostedService<SchedulerTask>();
    // builder.Services.AddHostedService<SchedulerTask>();    

    ConfigurationManager configuration = builder.Configuration;

    var encryptionEnabled = configuration.GetValue<bool>("EncryptionEnabled");

    builder.Services.AddHttpClient("ignoreSSL")
        .ConfigurePrimaryHttpMessageHandler(() =>
        {
            return new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (message, cert, chain, sslPolicyErrors) => true
            };
        });

    Monitor.Initialize(builder.Configuration, logger); // Initializing the Sentry


    // Hangfire Configuration
    //try
    //{
    //	var conString = configuration.GetConnectionString("Hangfire");

    //	builder.Services.AddHangfire(config =>
    //		config.UseStorage(new MySqlStorage(conString, new MySqlStorageOptions()
    //		{
    //			QueuePollInterval = TimeSpan.FromSeconds(5), // default is 15s
    //			JobExpirationCheckInterval = TimeSpan.FromHours(1),  // Adjust as needed
    //			CountersAggregateInterval = TimeSpan.FromMinutes(5), // Default is 5 minutes
    //		}))
    //	);

    //	builder.Services.AddHangfireServer(options =>
    //	{
    //		options.WorkerCount = 20; // depending on your server cores and workload
    //	});

    //	GlobalJobFilters.Filters.Add(new AutomaticExpirationAttribute(1));

    //	logger.Info("Hangfire successfully configured with MySQL storage.");
    //}
    //catch (Exception ex)
    //{
    //	logger.Error(ex, "Failed to configure Hangfire. Database might not be connected or may not exist.");
    //}

    if (configuration.GetValue<bool>("FireAndForget"))
    {
        logger.Info("Running Background Tasks in FireAndForget Method");
    }

    var context = new CustomAssemblyLoadContext();

    var isDevelopment = builder.Environment.IsDevelopment();

    if (isDevelopment)
    {
        context.LoadUnmanagedLibrary(Path.Combine(Directory.GetCurrentDirectory(), "libwkhtmltox.dll"));
    }
    else
    {
        context.LoadUnmanagedLibrary(Path.Combine(Directory.GetCurrentDirectory(), "libwkhtmltox.so"));
    }

    builder.Services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
    builder.Services.AddSingleton<ICacheClient, CacheClient>();
    builder.Services.AddSingleton<ILogClient, LogClient>();
    builder.Services.AddScoped<IEmailSender, EmailSender>();

    builder.Services.AddScoped<AuthorizeAttribute>();
    builder.Services.AddScoped<SessionValidationAttribute>();

    builder.Services.AddSingleton<INotificationRepository, NotificationRepository>();
    builder.Services.AddSingleton<IDocumentRepository, DocumentRepository>();
    builder.Services.AddSingleton<IRecepientsRepository, RecepientsRepository>();
    builder.Services.AddSingleton<ITemplateDocumentRepository, TemplateDocumentRepository>();
    builder.Services.AddSingleton<ITemplateRecepientRepository, TemplateRecepientRepository>();
    builder.Services.AddSingleton<IAuthenticationRepository, AuthenticationRepository>();
    builder.Services.AddSingleton<IErrorMessageRepository, ErrorMessageRepository>();
    builder.Services.AddSingleton<IUserRepository, UserRepository>();
    builder.Services.AddSingleton<IUserStorageRepository, UserStorageRepository>();
    builder.Services.AddSingleton<IConfigurationRepository, ConfigurationRepository>();
    builder.Services.AddSingleton<ISubscriberOrgTemplateRepository, SubscriberOrgTemplateRepository>();
    builder.Services.AddSingleton<ISubscriberOrgUserTemplateRepository, SubscriberOrgUserTemplateRepository>();
    builder.Services.AddSingleton<ITemplateRepository, TemplateRepository>();
    builder.Services.AddSingleton<IUserTemplateRepository, UserTemplateRepository>();
    builder.Services.AddSingleton<IBulkSignRepository, BulkSignRepository>();
    builder.Services.AddSingleton<IDelegationRepository, DelegationRepository>();
    builder.Services.AddSingleton<IDelegateeRepository, DelegateeRepository>();
    builder.Services.AddSingleton<IDigitalFormTemplateRepository, DigitalFormTemplateRepository>();
    builder.Services.AddSingleton<IDigitalFormResponseRepository, DigitalFormResponseRepository>();
    builder.Services.AddSingleton<INewDigitalFormResponseRepository, NewDigitalFormResponseRepository>();
    builder.Services.AddSingleton<IDigitalFormTemplateRoleRepository, DigitalFormTemplateRoleRepository>();
    builder.Services.AddSingleton<ISubscriberOrgGenericTemplateRepository, SubscriberOrgGenericTemplateRepository>();
    builder.Services.AddSingleton<IGroupSigningRepository, GroupSigningRepository>();
    builder.Services.AddSingleton<IGenericTemplateRepository, GenericTemplateRepository>();

    // This tells SignalR to use your class for user mapping
    builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IEDMSService, EDMSService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IAuthenticatService, AuthenticatService>();
    builder.Services.AddScoped<IDocumentService, DocumentService>();
    builder.Services.AddScoped<IGroupSigningService, GroupSigningService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IConfigurationService, ConfigurationService>();
    builder.Services.AddScoped<ITemplateService, TemplateService>();
    builder.Services.AddScoped<IUserTemplateService, UserTemplateService>();
    builder.Services.AddScoped<IBulkSignService, BulkSignService>();
    builder.Services.AddScoped<IStorageIntegrationService, StorageIntegrationService>();
    builder.Services.AddScoped<IDriveHelper, DriveHelper>();
    builder.Services.AddScoped<IDelegationService, DelegationService>();
    builder.Services.AddScoped<IDigitalFormTemplateService, DigitalFormTemplateService>();
    builder.Services.AddScoped<IDigitalFormResponseService, DigitalFormResponseService>();
    builder.Services.AddScoped<IDigitalFormTemplateRoleService, DigitalFormTemplateRoleService>();
    builder.Services.AddScoped<ITemplateDocumentService, TemplateDocumentService>();
    builder.Services.AddScoped<IConvertToPdfService, ConvertToPdfService>();
    builder.Services.AddScoped<IGenericTemplateService, GenericTemplateService>();
    builder.Services.AddScoped<IDigitalFormHelper, DigitalFormHelper>();
    builder.Services.AddScoped<IBackgroundService, SigningPortal.Core.Utilities.BackgroundService>();
    builder.Services.AddScoped<IGenericPushNotificationService, GenericPushNotificationService>();
    builder.Services.AddScoped<IGenericEmailService, GenericEmailService>();

    builder.Services.AddScoped<IRazorRendererHelper, RazorRendererHelper>();
    builder.Services.AddScoped<OpenID>();

    builder.Services.AddScoped<IDocumentHelper, DocumentHelper>();
    builder.Services.AddSingleton<IConstantError, ConstantError>();
    builder.Services.AddScoped<IGlobalDriveStorageConfiguration, GlobalDriveStorageConfiguration>();


    var mongoDBConnectionString = string.Empty;
    var redisConfigString = configuration.GetValue<string>("Config:RedisConnString");
    var s3ConfigJson = string.Empty;
    var kafkaBootstrap = string.Empty;
    var kafkaTopic = string.Empty;


    S3StorageConfiguration s3StorageConfig;

    if (isDevelopment)
    {
        mongoDBConnectionString = configuration.GetValue<string>("Config:MongoDbSettings:ConnectionString");
        //redisConfigString = configuration.GetValue<string>("Config:RedisConnString");

        s3StorageConfig = configuration
         .GetSection("Config:S3StorageConfiguration")
         .Get<S3StorageConfiguration>();
    }
    else
    {

        var vaultAddress = builder.Configuration["Config:Vault:Address"];
        var vaultToken = builder.Configuration["Config:Vault:Token"];
        var secretPath = builder.Configuration["Config:Vault:SecretPath"];
        var mountPath = builder.Configuration["Config:Vault:MountPath"];

        // Initialize Vault client
        var authMethod = new TokenAuthMethodInfo(vaultToken);
        var vaultClientSettings = new VaultClientSettings(vaultAddress, authMethod);
        var vaultClient = new VaultClient(vaultClientSettings);

        // Fetch secret data from Vault
        var secret = await vaultClient.V1.Secrets.KeyValue.V2.ReadSecretAsync(path: secretPath, mountPoint: mountPath);
        var data = secret.Data.Data;

        mongoDBConnectionString = data["MongoDbSettings:ConnectionString"].ToString();
        //redisConfigString = data["RedisConnString"].ToString();

        s3ConfigJson = data["S3StorageConfiguration"]?.ToString()
      ?? throw new InvalidOperationException("S3StorageConfiguration is missing in Vault.");
        kafkaBootstrap = data["kafka.bootstrap"].ToString();
        kafkaTopic = data["kafka.topic.signing"].ToString();


        s3StorageConfig = JsonSerializer.Deserialize<S3StorageConfiguration>(
            s3ConfigJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        ) ?? throw new InvalidOperationException("Failed to deserialize S3StorageConfiguration from Vault.");
    }

    builder.Services.Configure<S3StorageConfiguration>(options =>
    {
        options.Endpoint = s3StorageConfig.Endpoint;
        options.Bucket = s3StorageConfig.Bucket;
        options.AccessKey = s3StorageConfig.AccessKey;
        options.SecretKey = s3StorageConfig.SecretKey;
    });

    builder.Services.Configure<MongoDbSettings>(settings =>
    {
        settings.DatabaseName = configuration.GetValue<string>("Config:MongoDbSettings:DatabaseName");
        settings.ConnectionString = mongoDBConnectionString;
        settings.AuthenticationLogDbConnectionString = mongoDBConnectionString;
        settings.AuthenticationLogDatabaseName = configuration.GetValue<string>("Config:MongoDbSettings:AuthenticationLogDatabaseName");
    });

    // Bind configuration
    builder.Services.Configure<MinioConfiguration>(
        builder.Configuration.GetSection("Config:MinioConfiguration"));

    //Register Minio client once
    builder.Services.AddSingleton<IMinioClient>(sp =>
    {
        var cfg = sp.GetRequiredService<IOptions<MinioConfiguration>>().Value;

        return new MinioClient()
            .WithEndpoint(cfg.Endpoint)
            .WithCredentials(cfg.AccessKey, cfg.SecretKey)
            .WithSSL(false)
            .Build();
    });


    builder.Services.AddSingleton<IAmazonS3>(sp =>
    {
        var cfg = sp.GetRequiredService<IOptions<S3StorageConfiguration>>().Value;

        var s3Config = new AmazonS3Config
        {
            ServiceURL = cfg.Endpoint,
            ForcePathStyle = true,
            UseHttp = true
        };

        if (string.IsNullOrWhiteSpace(cfg.AccessKey))
        {
            return new AmazonS3Client(new AnonymousAWSCredentials(), s3Config);
        }

        return new AmazonS3Client(cfg.AccessKey, cfg.SecretKey, s3Config);
    });

    // Register Minio services
    builder.Services.AddScoped<IMinioDocumentRepository, MinioDocumentRepository>();
    builder.Services.AddScoped<IMinioStorageService, MinioStorageService>();
    builder.Services.AddScoped<IMinioService, MinioService>();

    builder.Services.AddScoped<IStorageService, StorageService>();
    builder.Services.AddScoped<IS3StorageService, S3StorageService>();
    builder.Services.AddScoped<IS3DocumentRepository, S3DocumentRepository>();


    if (encryptionEnabled)
    {
        builder.Services.PostConfigure<MongoDbSettings>(settings =>
        {
            settings.DatabaseName = settings.DatabaseName;
            settings.ConnectionString = PKIMethods.Instance.PKIDecryptSecureWireData(settings.ConnectionString);
            settings.AuthenticationLogDbConnectionString = PKIMethods.Instance.PKIDecryptSecureWireData(settings.AuthenticationLogDbConnectionString);
            settings.AuthenticationLogDatabaseName = settings.AuthenticationLogDatabaseName;
        });
    }

    builder.Services.AddSingleton<IMongoDbSettings>(serviceProvider =>
        serviceProvider.GetRequiredService<IOptions<MongoDbSettings>>().Value);

    builder.Services.Configure<GlobalConfiguration>(settings =>
    {
        settings.ApiTokenKeySecret = configuration.GetValue<string>("Secret:ApiTokenKeySecret");
        settings.FrontEndSecret = configuration.GetValue<string>("Secret:FrontEndSecret");
        settings.IDPClientId = configuration.GetValue<string>("Config:IDP_Config:Client_id");
        settings.IDPClientSecret = configuration.GetValue<string>("Config:IDP_Config:client_secret");
        settings.MobileIDPClientId = configuration.GetValue<string>("Config:Mobile_IDP_Secrets:client_ID");
        settings.MobileIDPClientSecret = configuration.GetValue<string>("Config:Mobile_IDP_Secrets:client_secret");
        //settings.RabbitMQConnectionString = configuration.GetValue<string>("Config:SigningPortalLogConfig:ConnectionString");
        settings.ReddisConnectionString = redisConfigString;
        settings.KafkaBootstrapServers = kafkaBootstrap;
        settings.KafkaTopicName = kafkaTopic;
        settings.KafkaEnabled = isDevelopment ? false : true;
    });

    if (encryptionEnabled)
    {

        if (string.IsNullOrWhiteSpace(redisConfigString))
        {
            throw new InvalidOperationException("Redis configuration is missing.");
        }

        redisConfigString = PKIMethods.Instance.PKIDecryptSecureWireData(redisConfigString);
      
        builder.Services.PostConfigure<GlobalConfiguration>(settings =>
        {
            settings.ApiTokenKeySecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.ApiTokenKeySecret);
            settings.FrontEndSecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.FrontEndSecret);
            settings.IDPClientId = PKIMethods.Instance.PKIDecryptSecureWireData(settings.IDPClientId);
            settings.IDPClientSecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.IDPClientSecret);
            settings.MobileIDPClientId = PKIMethods.Instance.PKIDecryptSecureWireData(settings.MobileIDPClientId);
            settings.MobileIDPClientSecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.MobileIDPClientSecret);
            //settings.RabbitMQConnectionString = PKIMethods.Instance.PKIDecryptSecureWireData(settings.RabbitMQConnectionString);
            settings.ReddisConnectionString = redisConfigString;
            settings.KafkaBootstrapServers = PKIMethods.Instance.PKIDecryptSecureWireData(settings.KafkaBootstrapServers);
            settings.KafkaTopicName = kafkaTopic;
            settings.KafkaEnabled = isDevelopment ? false : true;
        });

    }
    if (string.IsNullOrWhiteSpace(redisConfigString))
    {
        throw new InvalidOperationException("Redis configuration is missing.");
    }
    var redis = ConnectionMultiplexer.Connect(redisConfigString);

    builder.Services.AddDataProtection()
        .SetApplicationName("SigningPortal")
        .PersistKeysToStackExchangeRedis(redis, "SigningPortal-DataProtection-Keys");

    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConfigString;
        options.InstanceName = "SampleApp_";
    });

    builder.Services.AddSingleton<IGlobalConfiguration>(serviceProvider =>
        serviceProvider.GetRequiredService<IOptions<GlobalConfiguration>>().Value);

    //builder.Services.AddSession(options =>
    //{
    //	options.IdleTimeout = TimeSpan.FromMinutes(20);
    //	options.Cookie.HttpOnly = true;
    //	options.Cookie.IsEssential = true;
    //});

    builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
        .AddCookie(Config =>
        {
            Config.LoginPath = "/Login";
            Config.Cookie.Name = "SigningPortal";
            Config.LogoutPath = "/Logout";
            Config.AccessDeniedPath = new PathString("/Error/401");
            Config.Cookie.SameSite = SameSiteMode.None;
            Config.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        });
    builder.Services.AddSession(options =>
    {
        options.IdleTimeout = TimeSpan.FromMinutes(120);
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
    });

    var reddis = configuration.GetSection("Config:RedisConnString").Get<string>();

    //builder.Services.AddSignalR();
    builder.Services.AddSignalR().AddStackExchangeRedis(redisConfigString, options =>
    {
        options.Configuration.ClientName = "Notification";

        //options.ConnectionFactory = async writer =>
        //{
        //    var config = new ConfigurationOptions
        //    {
        //        AbortOnConnectFail = false
        //    };
        //    config.EndPoints.Add(IPAddress.Loopback, 0);
        //    config.SetDefaultPorts();
        //    var connection = await ConnectionMultiplexer.ConnectAsync(config, writer);
        //    connection.ConnectionFailed += (_, e) =>
        //    {
        //        Console.WriteLine("Connection to Redis failed.");
        //    };

        //    if (!connection.IsConnected)
        //    {
        //        Console.WriteLine("Did not connect to Redis.");
        //    }

        //    return connection;
        //};
    });

    builder.Services.AddControllers();
}

