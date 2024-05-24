using MGPOS.Pages;
using MGPOS.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Reflection;
using ZXing.Net.Maui.Controls;

namespace MGPOS
{
	public static class MauiProgram
	{
		public static MauiApp CreateMauiApp()
		{
			var builder = MauiApp.CreateBuilder();

			#region Setup App Configuration file
			Assembly getAssembly = Assembly.GetExecutingAssembly();
			using Stream stream = getAssembly.GetManifestResourceStream("MGPOS.appsettings.json");

			IConfigurationRoot config = new ConfigurationBuilder()
				.AddJsonStream(stream)
				.Build();

			builder.Configuration.AddConfiguration(config);
			#endregion

			builder
				.UseMauiApp<App>()
				.ConfigureFonts(fonts =>
				{
					fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
					fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
				})
				.UseBarcodeReader();

#if DEBUG
			builder.Logging.AddDebug();
#endif


			#region Dependancy Ingection - Services
			builder.Services.AddTransient<AuthService>();
			#endregion

			#region Dependancy Ingection - Pages
			builder.Services.AddTransient<LoadingPage>();
			builder.Services.AddTransient<LoginPage>();
			builder.Services.AddTransient<ProfilePage>();
			#endregion

			return builder.Build();
		}
	}
}
