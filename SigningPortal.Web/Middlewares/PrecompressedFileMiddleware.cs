namespace SigningPortal.Web.Middlewares
{
    public class PrecompressedFileMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IWebHostEnvironment _env;

        public PrecompressedFileMiddleware(RequestDelegate next, IWebHostEnvironment env)
        {
            _next = next;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var request = context.Request;
            var response = context.Response;

            string acceptEncoding = request.Headers["Accept-Encoding"];
            if (!string.IsNullOrEmpty(acceptEncoding) &&
                acceptEncoding.Contains("gzip") &&
                request.Path.Value.EndsWith(".min.js"))
            {
                var webRootPath = _env.WebRootPath;

                // Original request path: /dist/helpers.bundle.js
                var originalFilePath = Path.Combine(webRootPath, request.Path.Value.TrimStart('/'));

                var gzFilePath = originalFilePath + ".gz";

                if (File.Exists(gzFilePath))
                {
                    response.Headers["Content-Encoding"] = "gzip";
                    response.ContentType = "application/javascript";
                    response.Headers["Vary"] = "Accept-Encoding";
                    // Write the compressed file directly to the response stream
                    await response.SendFileAsync(gzFilePath);
                    return; // Don't call next middleware
                }
            }

            // Fallback: normal pipeline
            await _next(context);
        }

    }
}
