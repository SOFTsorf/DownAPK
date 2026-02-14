// api/apps.js
export default async function handler(req, res) {
  const { search } = req.query;

  // Liste deiner Quellen (F-Droid Format)
  const SOURCES = [
    { name: 'F-Droid', url: 'https://f-droid.org/repo/index-v1.json', iconHost: 'https://f-droid.org/repo/' },
    { name: 'IzzyOnDroid', url: 'https://apt.izzysoft.de/fdroid/repo/index-v1.json', iconHost: 'https://apt.izzysoft.de/fdroid/repo/' }
  ];

  try {
    // Alle Quellen gleichzeitig abrufen
    const responses = await Promise.all(
      SOURCES.map(source => fetch(source.url).then(r => r.json().then(data => ({ ...data, source }))))
    );

    let allApps = [];

    responses.forEach(data => {
      const sourceInfo = data.source;
      const appsFromSource = Object.values(data.apps).map(app => ({
        name: app.name || app.packageName,
        packageName: app.packageName,
        version: app.suggestedVersionName || 'Unknown',
        author: app.authorName || sourceInfo.name, // Falls kein Autor, nimm Quelle
        // Icon-Logik: Manche Repos brauchen den Pfad aus der JSON
        icon: app.icon ? `${sourceInfo.iconHost}${app.packageName}/en-US/${app.icon}` : `https://f-droid.org/repo/${app.packageName}/en-US/icon.png`,
        lastUpdated: app.lastUpdated,
        source: sourceInfo.name
      }));
      allApps = [...allApps, ...appsFromSource];
    });

    // 1. Suche (falls Parameter vorhanden)
    if (search) {
      const lowerSearch = search.toLowerCase();
      allApps = allApps.filter(app => 
        app.name.toLowerCase().includes(lowerSearch) || 
        app.packageName.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Sortieren (Neueste zuerst)
    allApps.sort((a, b) => b.lastUpdated - a.lastUpdated);

    // 3. Duplikate entfernen (falls eine App in beiden Repos ist)
    const uniqueApps = Array.from(new Map(allApps.map(item => [item.packageName, item])).values());

    // 4. Ergebnis begrenzen (z.B. Top 50 statt 30)
    res.status(200).json(uniqueApps.slice(0, 50));
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
