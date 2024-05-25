using MGPOS.Data;
using MGPOS.Data.MGPOSEntities;
using MGPOS.Pages;
using ZXing.QrCode.Internal;

namespace MGPOS
{
	public partial class MainPage : ContentPage
	{
		int count = 0;
		Users firstUser = null;

		public MainPage()
		{
			InitializeComponent();

			try
			{
				using MGPOSDBContext MGPOSContext = new MGPOSContextFactory().CreateDbContext(new string[0]);
				firstUser = MGPOSContext.Users.FirstOrDefault();
				
			}
			catch (Exception)
			{
				Shell.Current.GoToAsync($"{nameof(LoginPage)}");
			}

			Dispatcher.DispatchAsync(async () =>
			{
				await DisplayAlert("Barcode Detected", firstUser.Username, "OK");
			});
		}

		private void OnCounterClicked(object sender, EventArgs e)
		{
			count++;

			if (count == 1)
				CounterBtn.Text = $"Clicked {count} time";
			else
				CounterBtn.Text = $"Clicked {count} times";

			SemanticScreenReader.Announce(CounterBtn.Text);
		}
	}

}
