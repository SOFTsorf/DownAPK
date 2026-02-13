// api/apps.js
export default async function handler(req, res) {
  const { search } = req.query;

  try {
    const response = await fetch('https://f-droid.org/repo/index-v1.json');
    const data = await response.json();
    let apps = Object.values(data.apps);

    // 1. Suche
    if (search) {
      const lowerSearch = search.toLowerCase();
      apps = apps.filter(app => 
        (app.name && app.name.toLowerCase().includes(lowerSearch)) || 
        (app.packageName && app.packageName.toLowerCase().includes(lowerSearch))
      );
    }

    // 2. Sortieren (Aktuellste zuerst)
    apps.sort((a, b) => b.lastUpdated - a.lastUpdated);

    // 3. Daten bereinigen ("undefined" verhindern)
    const result = apps.slice(0, 30).map(app => ({
      name: app.name || app.packageName, // Fallback falls Name fehlt
      packageName: app.packageName,
      version: app.suggestedVersionName || 'Unknown',
      author: app.authorName || 'Open Source',
      icon: `https://f-droid.org/repo/${app.packageName}/en-US/icon.png`
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
}
