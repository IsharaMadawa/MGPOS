﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using MGPOS.Data.MGPOSEntities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;

namespace MGPOS.Data.MGPOSEntities
{
    public partial class MGPOSDBContext
    {
        private IMGPOSDBContextProcedures _procedures;

        public virtual IMGPOSDBContextProcedures Procedures
        {
            get
            {
                if (_procedures is null) _procedures = new MGPOSDBContextProcedures(this);
                return _procedures;
            }
            set
            {
                _procedures = value;
            }
        }

        public IMGPOSDBContextProcedures GetProcedures()
        {
            return Procedures;
        }
    }

    public partial class MGPOSDBContextProcedures : IMGPOSDBContextProcedures
    {
        private readonly MGPOSDBContext _context;

        public MGPOSDBContextProcedures(MGPOSDBContext context)
        {
            _context = context;
        }
    }
}