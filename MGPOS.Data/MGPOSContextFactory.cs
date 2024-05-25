using MGPOS.Data.MGPOSEntities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Configuration;
using System.Reflection;

namespace MGPOS.Data
{
	public class MGPOSContextFactory : IDesignTimeDbContextFactory<MGPOSDBContext>
	{
		static string? connectionString = null;

		public MGPOSContextFactory()
		{
			//IConfiguration config = new ConfigurationBuilder()
			//   .SetBasePath(Directory.GetCurrentDirectory())
			//   .AddJsonFile("efpt.config.json", true, true)
			//   .Build();

			//Assembly getAssembly = Assembly.GetAssembly(typeof("GMPOS"));
			//Stream stream = getAssembly.GetManifestResourceStream("MGPOS.appsettings.json");
			//IConfigurationRoot config = new ConfigurationBuilder()
			//	.AddJsonStream(stream)
			//	.Build();

			//var config = new ConfigurationBuilder()
			//				 .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
			//				 .Build();

			//string valll = config.GetSection("ConnectionStrings:MGPOSConnection").Value;

			//connectionString = config["ConnectionStrings:MGPOSConnection"];

			string Database_IP_Address = Preferences.Default.Get("Database_IP_Address", "");
			connectionString = @"Data Source=" + Database_IP_Address + ",1433;Initial Catalog=MGPOS.Main;User Id=appuser; Password=intel@123;Integrated Security=True;MultiSubnetFailover=True;Encrypt=true;TrustServerCertificate=True;Trusted_Connection=false;Pooling=False";
		}	

		public MGPOSDBContext CreateDbContext(string[] strings)
		{
			DbContextOptionsBuilder<MGPOSDBContext> optionsBuilder = new DbContextOptionsBuilder<MGPOSDBContext>();

			optionsBuilder.UseSqlServer(connectionString);

			return new MGPOSDBContext(optionsBuilder.Options);
		}
	}
}
