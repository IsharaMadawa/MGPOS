using MGPOS.Pages;

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
			
		}
	}
}
