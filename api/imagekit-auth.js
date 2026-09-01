import ImageKit from "imagekit";

export default function handler(req, res) {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_2whN80fDWdIcfamm9JioaAVsZnM=';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.VITE_IMAGEKIT_PRIVATE_KEY || 'private_qcl5XcdOncElqHM06FMJ3VpgO3o=';
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/vrtbi4wsn';

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });

    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    res.status(200).json({
      ...authenticationParameters,
      publicKey,
      urlEndpoint
    });
  } catch (error) {
    console.error("ImageKit Auth Error:", error.message);
    res.status(500).json({ error: "ImageKit Auth Failed", details: error.message });
  }
}