using DinkToPdf;
using DinkToPdf.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using NLog;
using NLog.Web;
using Quartz;
using SigningPortal.API.Attributes;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Persistence.Repositories;
using SigningPortal.Core.Services;
using SigningPortal.Core.Sheduler;
using SigningPortal.Core.Utilities;
using Swashbuckle.AspNetCore.SwaggerUI;
using System;
using System.IO;
using System.Net.Http;

var logger = NLog.LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();
logger.Debug("init main");

try
{
    var builder = WebApplication.CreateBuilder(args);

    Console.WriteLine(builder.Environment.EnvironmentName);

    ConfigureServices(builder);

    // NLog: Setup NLog for Dependency injection
    builder.Logging.ClearProviders();
    builder.Logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
    builder.Host.UseNLog();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "MongoDB POC");
            c.DocumentTitle = "MongoDB POC";
            c.DocExpansion(DocExpansion.List);
        });
        //app.UseExceptionHandler("/error-local-development");
    }
    else
    {
        app.UseExceptionHandler("/error");
    }

    app.UseFileServer(new FileServerOptions
    {
        FileProvider = new PhysicalFileProvider(
                        Path.Combine(Directory.GetCurrentDirectory(), "Resource")),
        RequestPath = "/Resource",
        EnableDefaultFiles = true
    });

    app.UseHttpsRedirection();

    app.UseRouting();
    app.UseCors("CorsPolicy");
    app.UseAuthentication();

    app.UseAuthorization();

    app.UseEndpoints(endpoints =>
    {
        _ = endpoints.MapHub<NotificationHub>("/pushNotification");
        _ = endpoints.MapControllers();
    });

    app.Run();
}
catch (Exception exception)
{
    // NLog: catch setup errors
    logger.Error(exception.Message, "Stopped program because of exception");
    throw;
}
finally
{
    // Ensure to flush and stop internal timers/threads before application-exit (Avoid segmentation fault on Linux)
    NLog.LogManager.Shutdown();
}

void ConfigureServices(WebApplicationBuilder builder)
{
    builder.Services.AddQuartz(q =>
    {
        q.UseMicrosoftDependencyInjectionJobFactory();

        var jobKey = new JobKey("CheckDocumentExpiryAndCleanNotification");
        q.AddJob<CheckDocumentExpiryAndCleanNotification>(opts => opts.WithIdentity(jobKey));
        q.AddTrigger(opts => opts
            .ForJob(jobKey)
            .WithIdentity("CheckDocumentExpiryAndCleanNotification-trigger")
            .WithSimpleSchedule(x => x
                .WithIntervalInHours(24)
                .RepeatForever()));

        var SigningReminderJobKey = new JobKey("SigningReminder");
        q.AddJob<SigningReminder>(opts => opts.WithIdentity(SigningReminderJobKey));
        q.AddTrigger(opts => opts
            .ForJob(SigningReminderJobKey)
            .WithIdentity("SigningReminder-trigger")
            .WithSimpleSchedule(x => x
                .WithIntervalInHours(12)
                .RepeatForever()));

    });
    builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);
    // builder.Services.AddHostedService<SchedulerTask>();

    ConfigurationManager configuration = builder.Configuration;

    var encryptionEnabled = configuration.GetValue<bool>("EncryptionEnabled");

    var origins = configuration.GetSection("Origin_url").Get<string[]>();
    if (origins == null)
    {
        Console.WriteLine("origins is null");
    }
    else
    {
        Console.WriteLine(origins[1]);
    }

    builder.Services.AddCors(option =>
    {
        option.AddPolicy("CorsPolicy", builders =>
                 builders.WithOrigins(configuration.GetSection("Origin_url").Get<string[]>())
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials());
    });

    builder.Services.AddHttpClient("ignoreSSL")
        .ConfigurePrimaryHttpMessageHandler(() =>
        {
            return new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (message, cert, chain, sslPolicyErrors) => true
            };
        });

    var context = new CustomAssemblyLoadContext();
    if (builder.Environment.IsDevelopment())
    {
        context.LoadUnmanagedLibrary(Path.Combine(Directory.GetCurrentDirectory(), "libwkhtmltox.dll"));
    }
    else
    {
        context.LoadUnmanagedLibrary(Path.Combine(Directory.GetCurrentDirectory(), "libwkhtmltox.so"));
    }

    builder.Services.AddSingleton<SigningPortal.Core.Utilities.BackgroundService>();

    builder.Services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
    builder.Services.AddScoped<AuthorizeAttribute>();
    builder.Services.AddSingleton<ICacheClient, CacheClient>();
    builder.Services.AddSingleton<ILogClient, LogClient>();
    builder.Services.AddScoped<IEmailSender, EmailSender>();

    builder.Services.AddSingleton<INotificationRepository, NotificationRepository>();
    builder.Services.AddSingleton<IDocumentRepository, DocumentRepository>();
    builder.Services.AddSingleton<IRecepientsRepository, RecepientsRepository>();
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
    builder.Services.AddSingleton<IDelegateeRepository, DelegateeRepository>();
    builder.Services.AddSingleton<IDelegationRepository, DelegationRepository>();
    builder.Services.AddSingleton<IDigitalFormTemplateRepository, DigitalFormTemplateRepository>();
    builder.Services.AddSingleton<IDigitalFormResponseRepository, DigitalFormResponseRepository>();
    builder.Services.AddSingleton<IDigitalFormTemplateRoleRepository, DigitalFormTemplateRoleRepository>();

    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IEDMSService, EDMSService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IAuthenticatService, AuthenticatService>();
    builder.Services.AddScoped<IDocumentService, DocumentService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IConfigurationService, ConfigurationService>();
    builder.Services.AddScoped<ITemplateService, TemplateService>();
    builder.Services.AddScoped<IUserTemplateService, UserTemplateService>();
    builder.Services.AddScoped<IBulkSignService, BulkSignService>();
    builder.Services.AddScoped<IDigitalFormTemplateService, DigitalFormTemplateService>();
    builder.Services.AddScoped<IDigitalFormResponseService, DigitalFormResponseService>();
    builder.Services.AddScoped<IDigitalFormTemplateRoleService, DigitalFormTemplateRoleService>();

    builder.Services.AddScoped<IDocumentHelper, DocumentHelper>();
    builder.Services.AddScoped<IDriveHelper, DriveHelper>();
    builder.Services.AddSingleton<IConstantError, ConstantError>();
    builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("Config:MongoDbSettings"));

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
        settings.RabbitMQConnectionString = configuration.GetValue<string>("Config:SigningPortalLogConfig:ConnectionString");
        settings.ReddisConnectionString = configuration.GetValue<string>("Config:RedisConnString");
    });

    if (encryptionEnabled)
    {
        builder.Services.PostConfigure<GlobalConfiguration>(settings =>
        {
            settings.ApiTokenKeySecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.ApiTokenKeySecret);
            settings.FrontEndSecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.FrontEndSecret);
            settings.IDPClientId = PKIMethods.Instance.PKIDecryptSecureWireData(settings.IDPClientId);
            settings.IDPClientSecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.IDPClientSecret);
            settings.MobileIDPClientId = PKIMethods.Instance.PKIDecryptSecureWireData(settings.MobileIDPClientId);
            settings.MobileIDPClientSecret = PKIMethods.Instance.PKIDecryptSecureWireData(settings.MobileIDPClientSecret);
            settings.RabbitMQConnectionString = PKIMethods.Instance.PKIDecryptSecureWireData(settings.RabbitMQConnectionString);
            settings.ReddisConnectionString = PKIMethods.Instance.PKIDecryptSecureWireData(settings.ReddisConnectionString);
        });
    }

    builder.Services.AddSingleton<IGlobalConfiguration>(serviceProvider =>
        serviceProvider.GetRequiredService<IOptions<GlobalConfiguration>>().Value);

    var reddis = configuration.GetSection("Config:RedisConnString").Get<string>();

    //builder.Services.AddSignalR();
    builder.Services.AddSignalR().AddStackExchangeRedis(encryptionEnabled ? PKIMethods.Instance.PKIDecryptSecureWireData(reddis) : reddis, options =>
    {
        //create client in redis server using  cmd
        //1) redis-cli 
        //2) CLIENT SETNAME Notification 
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


    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "SigningPortalApi", Version = "v1" });
    });

    builder.Services.AddControllers();
}