using MGPOS.Services;

namespace MGPOS.Pages;

public partial class LoadingPage : ContentPage
{
	private readonly AuthService _authService;

	public LoadingPage(AuthService authService)
	{
		InitializeComponent();
		_authService = authService;
	}

	protected async override void OnNavigatedTo(NavigatedToEventArgs args)
	{
		base.OnNavigatedTo(args);

		if(await _authService.IsAuthenticatedAsync())
		{
			await Shell.Current.GoToAsync($"//{nameof(MainPage)}");
		}
		else
		{
			await Shell.Current.GoToAsync($"//{nameof(LoginPage)}");
		}
	}
}