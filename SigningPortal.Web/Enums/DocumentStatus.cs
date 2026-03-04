using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.Enums
{
    public enum DocumentStatus
    {
        [Display(Name = "All")]
        All,

        [Display(Name = "Signatures_Pending")]
        Signatures_Pending,

        [Display(Name = "Completed")]
        Completed,

        [Display(Name="Declined")]
        Declined,

        [Display(Name = "Expired")]
        Expired,

        [Display(Name = "Recalled")]
        Recalled,

    }
}
