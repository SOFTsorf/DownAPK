// api/details.js
export default async function handler(req, res) {
  const { id, action } = req.query; // id = paketname, action = 'download' oder leer

  if (!id) return res.status(400).json({ error: 'Missing ID' });

  try {
    const response = await fetch('https://f-droid.org/repo/index-v1.json');
    const data = await response.json();
    
    // Wir suchen die App im riesigen Index
    const app = data.apps.find(a => a.packageName === id);

    if (!app) return res.status(404).json({ error: 'App not found' });

    // Wenn der User "download" will -> Wir leiten ihn zur APK weiter (maskiert)
    if (action === 'download') {
        const apkUrl = `https://f-droid.org/repo/${app.packageName}_${app.suggestedVersionCode}.apk`;
        return res.redirect(307, apkUrl); 
    }

    // Sonst: Details zurückgeben für die App-Seite
    res.status(200).json({
      name: app.name || app.packageName,
      packageName: app.packageName,
      version: app.suggestedVersionName || 'Latest',
      versionCode: app.suggestedVersionCode,
      author: app.authorName || 'Open Source',
      description: app.description || app.summary || 'No description available.',
      lastUpdated: new Date(app.lastUpdated).toLocaleDateString(),
      icon: `https://f-droid.org/repo/${app.packageName}/en-US/icon.png`,
      downloadUrl: `/api/details?id=${app.packageName}&action=download` // Unser eigener Link!
    });

  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
}
