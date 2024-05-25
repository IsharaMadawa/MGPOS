namespace MGPOS.Pages.InitialConfig;

public partial class InitialConfigLoginPage : ContentPage
{
	public InitialConfigLoginPage()
	{
		InitializeComponent();
	}

	private async void Button_Clicked(object sender, EventArgs e)
	{
		await Shell.Current.GoToAsync($"{nameof(InitialConfigPage)}");
	}
}