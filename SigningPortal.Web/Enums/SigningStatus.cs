using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.Enums
{
    public enum SigningStatus
    {
        [Display(Name = "All")]
        All,

        [Display(Name = "Need to sign")]
        NeedToSign,

        [Display(Name = "Signed")]
        Signed,

        [Display(Name = "In Progress")]
        InProgress,

        [Display(Name = "Failed")]
        Failed,


        [Display(Name = "Rejected")]
        Rejected,

        [Display(Name = "Waiting_for_Others")]
        WaitingforOthers,



    }
}
