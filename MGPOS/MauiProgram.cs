using MGPOS.Pages;
using MGPOS.Services;
using Microsoft.Extensions.Logging;

namespace MGPOS
{
	public static class MauiProgram
	{
		public static MauiApp CreateMauiApp()
		{
			var builder = MauiApp.CreateBuilder();
			builder
				.UseMauiApp<App>()
				.ConfigureFonts(fonts =>
				{
					fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
					fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
				});

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
