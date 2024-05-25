namespace MGPOS.Pages.InitialConfig;

public partial class InitialConfigPage : ContentPage
{
	public InitialConfigPage()
	{
		InitializeComponent();

		string Database_IP_Address = Preferences.Default.Get("Database_IP_Address", "");
		dbIPAddress.Text = Database_IP_Address;
	}

	private void SaveConfig_Button_Clicked(object sender, EventArgs e)
	{
		Preferences.Default.Set("Database_IP_Address", dbIPAddress.Text);
	}
}