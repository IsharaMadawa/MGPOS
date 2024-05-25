using ZXing.Net.Maui;

namespace MGPOS.Pages;

public partial class BillingPage : ContentPage
{
	public BillingPage()
	{
		InitializeComponent();
		//cameraBarcodeReaderView.Options = new ZXing.Net.Maui.BarcodeReaderOptions
		//{
		//	AutoRotate = true,
		//	Multiple = false,
		//};
	}

	private void PrintPreview_Button_Clicked(object sender, EventArgs e)
	{

	}

	//protected override void OnNavigatedFrom(NavigatedFromEventArgs args)
	//   {
	//	base.OnNavigatedFrom(args);
	//}

	//private void cameraBarcodeReaderView_BarcodesDetected(object sender, ZXing.Net.Maui.BarcodeDetectionEventArgs e)
	//{
	//	BarcodeResult barcode = e.Results.FirstOrDefault();

	//	if(barcode == null)
	//	{
	//		return;
	//	}
	//	else
	//	{
	//		Dispatcher.DispatchAsync(async () =>
	//		{
	//			await DisplayAlert("Barcode Detected", barcode.Value, "OK");
	//		});
	//	}
	//}
}