// api/apps.js
export default async function handler(req, res) {
  const { search } = req.query; // Suchbegriff aus der URL lesen

  try {
    // 1. Daten von F-Droid holen (Server-zu-Server hat kein CORS!)
    const response = await fetch('https://f-droid.org/repo/index-v1.json');
    const data = await response.json();

    // 2. Apps in ein Array umwandeln
    let apps = Object.values(data.apps);

    // 3. Filtern (falls gesucht wird)
    if (search) {
      const lowerSearch = search.toLowerCase();
      apps = apps.filter(app => 
        app.name.toLowerCase().includes(lowerSearch) || 
        app.packageName.toLowerCase().includes(lowerSearch)
      );
    }

    // 4. Sortieren (Neueste zuerst - simuliert anhand lastUpdated)
    apps.sort((a, b) => b.lastUpdated - a.lastUpdated);

    // 5. Nur die ersten 30 Apps zurückgeben (Performance)
    const result = apps.slice(0, 30).map(app => ({
      name: app.name,
      packageName: app.packageName,
      version: app.suggestedVersionName || 'Latest',
      author: app.authorName || 'Open Source',
      lastUpdated: app.lastUpdated,
      icon: `https://f-droid.org/repo/${app.packageName}/en-US/icon.png`
    }));

    // 6. Antwort an dein Frontend senden
    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fehler beim Laden der Daten' });
  }
}
