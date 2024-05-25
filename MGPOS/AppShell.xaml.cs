using MGPOS.Pages;
using MGPOS.Pages.InitialConfig;

namespace MGPOS
{
	public partial class AppShell : Shell
	{
		public AppShell()
		{
			InitializeComponent();

			//Routing
			Routing.RegisterRoute(nameof(MainPage), typeof(MainPage));
			Routing.RegisterRoute(nameof(BillingPage), typeof(BillingPage));
			Routing.RegisterRoute(nameof(LoadingPage), typeof(LoadingPage));
			Routing.RegisterRoute(nameof(LoginPage), typeof(LoginPage));		
			Routing.RegisterRoute(nameof(ProfilePage), typeof(ProfilePage));
			Routing.RegisterRoute(nameof(InitialConfigLoginPage), typeof(InitialConfigLoginPage));
			Routing.RegisterRoute(nameof(InitialConfigPage), typeof(InitialConfigPage));
		}
	}
}
