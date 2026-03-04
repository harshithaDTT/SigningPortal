// Online C# Editor for free
// Write, Edit and Run your C# code using C# Online Compiler

using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
public class HelloWorld
{


    public static byte[] AESEncrypt(byte[] bytesToBeEncrypted, byte[] passwordBytes, byte[] saltBytes)
    {
        byte[] encryptedBytes = null;

        using (MemoryStream ms = new MemoryStream())
        {
            using (RijndaelManaged aes = new RijndaelManaged())
            {
                aes.KeySize = 256;
                aes.BlockSize = 128;

                var key = new Rfc2898DeriveBytes(passwordBytes, saltBytes, 1000);
                aes.Key = key.GetBytes(aes.KeySize / 8);
                aes.IV = key.GetBytes(aes.BlockSize / 8);

                aes.Mode = CipherMode.CBC;

                using (var cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(bytesToBeEncrypted, 0, bytesToBeEncrypted.Length);
                    cs.Close();
                }
                encryptedBytes = ms.ToArray();
            }
        }

        return encryptedBytes;
    }

    public static byte[] AESDecrypt(byte[] bytesToBeDecrypted, byte[] passwordBytes, byte[] saltBytes)
    {
        byte[] decryptedBytes = null;

        using (MemoryStream ms = new MemoryStream())
        {
            using (RijndaelManaged aes = new RijndaelManaged())
            {
                aes.KeySize = 256;
                aes.BlockSize = 128;

                var key = new Rfc2898DeriveBytes(passwordBytes, saltBytes, 1000);
                aes.Key = key.GetBytes(aes.KeySize / 8);
                aes.IV = key.GetBytes(aes.BlockSize / 8);

                aes.Mode = CipherMode.CBC;

                using (var cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(bytesToBeDecrypted, 0, bytesToBeDecrypted.Length);
                    cs.Close();
                }
                decryptedBytes = ms.ToArray();
            }
        }

        return decryptedBytes;
    }

    public static string EncryptText(string input, string encryptionPassword, string passwordSalt)
    {
        // Get the bytes of the string
        byte[] bytesToBeEncrypted = Encoding.UTF8.GetBytes(input);
        byte[] passwordBytes = Encoding.UTF8.GetBytes(encryptionPassword);

        // Hash the password with SHA256
        passwordBytes = SHA256.Create().ComputeHash(passwordBytes);

        byte[] saltBytes = Encoding.UTF8.GetBytes(passwordSalt);

        byte[] bytesEncrypted = AESEncrypt(bytesToBeEncrypted, passwordBytes, saltBytes);

        string result = Convert.ToBase64String(bytesEncrypted);

        return result;
    }

    public static string DecryptText(string input, string encryptionPassword, string passwordSalt)
    {
        // Get the bytes of the string
        byte[] bytesToBeDecrypted = Convert.FromBase64String(input);
        byte[] passwordBytes = Encoding.UTF8.GetBytes(encryptionPassword);
        passwordBytes = SHA256.Create().ComputeHash(passwordBytes);

        // Hash the password with SHA256
        byte[] saltBytes = Encoding.UTF8.GetBytes(passwordSalt);

        byte[] bytesDecrypted = AESDecrypt(bytesToBeDecrypted, passwordBytes, saltBytes);

        string result = Encoding.UTF8.GetString(bytesDecrypted);

        return result;
    }




    public static void Main(string[] args)
    {
        var pass = "68g3JRZ5NUC";
        var key = "RGlnaXRhbHRydXN0dGVjaFNpZ25pbmdQb3J0YWw=";//DigitaltrusttechSigningPortal

        Console.WriteLine("Original :: " + pass);

        var ekey = Encoding.UTF8.GetString(Convert.FromBase64String(key));

        var encryptionPassword = string.Empty;
        encryptionPassword = EncryptText(pass,
           ekey, "SigningPortal_v0.1");


        Console.WriteLine("encryptionPassword :: " + encryptionPassword);

        var DecryptedPasswd = string.Empty;
        // Decrypt Password
        DecryptedPasswd = DecryptText(encryptionPassword,
            ekey, "SigningPortal_v0.1");

        Console.WriteLine("DecryptedPasswd :: " + DecryptedPasswd);
    }
}