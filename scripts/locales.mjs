// Source of truth for UI strings: generates src/_locales/{en,ru,de,fr}/messages.json.
// $1, $2 become Chrome i18n placeholders. Order: [en, ru, de, fr].
//   node scripts/locales.mjs
import { writeFile, mkdir } from "node:fs/promises";

const LOCALES = ["en", "ru", "de", "fr"];

const M = {
  extName: ["CookieTin — Cookie Manager & Editor", "CookieTin — менеджер и редактор cookie", "CookieTin — Cookie-Manager & Editor", "CookieTin — gestionnaire et éditeur de cookies"],
  extDescription: [
    "View, edit, protect, import and export cookies. Containers, private windows and partitioned cookies. Nothing leaves your browser.",
    "Просмотр, правка, защита, импорт и экспорт cookie. Контейнеры, приватные окна, изолированные cookie. Данные не покидают браузер.",
    "Cookies ansehen, bearbeiten, schützen, importieren und exportieren. Container, private Fenster, partitionierte Cookies.",
    "Voir, modifier, protéger, importer et exporter les cookies. Conteneurs, navigation privée, cookies partitionnés. Tout reste local."
  ],

  // Common
  settings: ["Settings", "Настройки", "Einstellungen", "Paramètres"],
  support: ["Support", "Поддержать", "Unterstützen", "Soutenir"],
  cancel: ["Cancel", "Отмена", "Abbrechen", "Annuler"],
  close: ["Close", "Закрыть", "Schließen", "Fermer"],
  copy: ["Copy", "Копировать", "Kopieren", "Copier"],
  copied: ["Copied!", "Скопировано!", "Kopiert!", "Copié !"],
  delete: ["Delete", "Удалить", "Löschen", "Supprimer"],
  save: ["Save", "Сохранить", "Speichern", "Enregistrer"],
  download: ["Download", "Скачать", "Herunterladen", "Télécharger"],
  import: ["Import", "Импорт", "Importieren", "Importer"],
  export: ["Export", "Экспорт", "Exportieren", "Exporter"],
  refresh: ["Refresh", "Обновить", "Aktualisieren", "Actualiser"],
  undo: ["Undo", "Отменить", "Rückgängig", "Annuler"],
  protect: ["Protect", "Защитить", "Schützen", "Protéger"],
  unprotect: ["Unprotect", "Снять защиту", "Schutz aufheben", "Retirer la protection"],
  protected: ["Protected", "Защищено", "Geschützt", "Protégé"],
  select: ["Select", "Выбрать", "Auswählen", "Sélectionner"],
  storeDefault: ["Default", "Обычные окна", "Standard", "Par défaut"],
  storePrivate: ["Private windows", "Приватные окна", "Private Fenster", "Navigation privée"],
  accessNeeded: [
    "CookieTin needs access to all sites to see and edit their cookies.",
    "CookieTin нужен доступ ко всем сайтам, чтобы видеть и править их cookie.",
    "CookieTin braucht Zugriff auf alle Websites, um deren Cookies zu sehen und zu bearbeiten.",
    "CookieTin a besoin d’accéder à tous les sites pour voir et modifier leurs cookies."
  ],
  accessGrant: ["Allow", "Разрешить", "Erlauben", "Autoriser"],
  deletedCount: ["Deleted cookies: $1.", "Удалено cookie: $1.", "Gelöschte Cookies: $1.", "Cookies supprimés : $1."],
  keptProtected: ["Protected ones kept: $1.", "Защищённые оставлены: $1.", "Geschützte behalten: $1.", "Cookies protégés conservés : $1."],
  deleteFailed: ["Failed: $1.", "Не удалось: $1.", "Fehlgeschlagen: $1.", "Échecs : $1."],
  restoredCount: ["Restored cookies: $1.", "Восстановлено cookie: $1.", "Wiederhergestellte Cookies: $1.", "Cookies restaurés : $1."],
  protectedStay: ["$1 protected will stay", "защищённые останутся: $1", "$1 geschützte bleiben", "$1 protégés resteront"],

  // Popup
  noSiteHere: ["No website in this tab", "В этой вкладке нет сайта", "Keine Website in diesem Tab", "Aucun site dans cet onglet"],
  popupManageSite: ["Cookies of $1", "Cookie сайта $1", "Cookies von $1", "Cookies de $1"],
  popupOpenManager: ["Open cookie manager", "Открыть менеджер cookie", "Cookie-Manager öffnen", "Ouvrir le gestionnaire"],
  popupDeleteSite: ["Delete cookies of $1", "Удалить cookie сайта $1", "Cookies von $1 löschen", "Supprimer les cookies de $1"],
  popupClearStorage: ["Clear site data", "Очистить данные сайта", "Website-Daten löschen", "Effacer les données du site"],
  popupClearStorageHint: ["localStorage, sessionStorage, IndexedDB, cache", "localStorage, sessionStorage, IndexedDB, кэш", "localStorage, sessionStorage, IndexedDB, Cache", "localStorage, sessionStorage, IndexedDB, cache"],
  popupDeleteStore: ["Delete all cookies: $1", "Удалить все cookie: $1", "Alle Cookies löschen: $1", "Supprimer tous les cookies : $1"],
  popupConfirmStore: ["Click again to delete $1 cookies", "Нажмите ещё раз, чтобы удалить cookie: $1", "Erneut klicken, um $1 Cookies zu löschen", "Cliquez encore pour supprimer $1 cookies"],
  storageCleared: ["Site data cleared.", "Данные сайта очищены.", "Website-Daten gelöscht.", "Données du site effacées."],

  // Manager
  searchPlaceholder: ["Search: domain  name:session  value:abc", "Поиск: домен  name:session  value:abc", "Suche: Domain  name:session  value:abc", "Rechercher : domaine  name:session  value:abc"],
  allStores: ["All windows & containers", "Все окна и контейнеры", "Alle Fenster & Container", "Toutes fenêtres et conteneurs"],
  subdomains: ["Subdomains", "Поддомены", "Subdomains", "Sous-domaines"],
  subdomainsHint: ["Selecting a domain also shows the cookies of its subdomains", "При выборе домена показывать и cookie его поддоменов", "Beim Auswählen einer Domain auch Cookies ihrer Subdomains zeigen", "Afficher aussi les cookies des sous-domaines du domaine choisi"],
  newCookieShort: ["New", "Создать", "Neu", "Nouveau"],
  domains: ["Domains", "Домены", "Domains", "Domaines"],
  cookies: ["Cookies", "Cookie", "Cookies", "Cookies"],
  details: ["Details", "Подробности", "Details", "Détails"],
  showAll: ["Show all", "Показать все", "Alle zeigen", "Tout afficher"],
  nothingFound: ["Nothing found", "Ничего не найдено", "Nichts gefunden", "Aucun résultat"],
  noCookies: ["No cookies here yet", "Cookie пока нет", "Noch keine Cookies", "Aucun cookie pour l’instant"],
  noCookiesHere: ["No cookies", "Нет cookie", "Keine Cookies", "Aucun cookie"],
  selectAll: ["Select all", "Выбрать все", "Alle auswählen", "Tout sélectionner"],
  selectedCount: ["Selected: $1", "Выбрано: $1", "Ausgewählt: $1", "Sélection : $1"],
  kindAll: ["All", "Все", "Alle", "Tous"],
  kindSession: ["Session", "Сеансовые", "Sitzung", "Session"],
  kindPersistent: ["With expiry", "С датой истечения", "Mit Ablaufdatum", "Avec expiration"],
  kindProtected: ["Protected", "Защищённые", "Geschützt", "Protégés"],
  kindPartitioned: ["Partitioned", "Изолированные", "Partitioniert", "Partitionnés"],
  kindInsecure: ["Not Secure", "Без Secure", "Ohne Secure", "Sans Secure"],
  copyTo: ["Copy to…", "Копировать в…", "Kopieren nach…", "Copier vers…"],
  copyToHint: ["Copy the selected cookies to another container or window", "Скопировать выбранные cookie в другой контейнер или окно", "Ausgewählte Cookies in einen anderen Container kopieren", "Copier les cookies choisis vers un autre conteneur"],
  copiedToStore: ["Copied $1 cookies to $2.", "Скопировано cookie: $1 → $2.", "$1 Cookies nach $2 kopiert.", "$1 cookies copiés vers $2."],
  partitionedIn: ["Partitioned: stored for $1", "Изолированный: хранится для сайта $1", "Partitioniert: gespeichert für $1", "Partitionné : stocké pour $1"],
  hasProtected: ["Has protected cookies", "Есть защищённые cookie", "Enthält geschützte Cookies", "Contient des cookies protégés"],
  noName: ["(no name)", "(без имени)", "(ohne Namen)", "(sans nom)"],
  tooMany: ["Showing the first $1. Narrow down the search to see the rest.", "Показаны первые $1. Уточните поиск, чтобы увидеть остальные.", "Die ersten $1 werden angezeigt. Suche eingrenzen für den Rest.", "Affichage des $1 premiers. Affinez la recherche pour voir la suite."],
  pickCookie: ["Pick a cookie to see and edit it.", "Выберите cookie, чтобы посмотреть и изменить его.", "Wählen Sie ein Cookie zum Ansehen und Bearbeiten.", "Choisissez un cookie pour le voir et le modifier."],
  shortcutsHint: [
    "Ctrl/⌘ or Shift + click selects several. / — search, Delete — delete, Ctrl+S — save.",
    "Ctrl/⌘ или Shift + клик выделяет несколько. / — поиск, Delete — удалить, Ctrl+S — сохранить.",
    "Strg/⌘ oder Umschalt + Klick wählt mehrere. / — Suche, Entf — löschen, Strg+S — speichern.",
    "Ctrl/⌘ ou Maj + clic pour en choisir plusieurs. / — recherche, Suppr — supprimer, Ctrl+S — enregistrer."
  ],
  bulkHint: ["Use the buttons above the list: delete, protect, export or copy them.", "Действия — в панели над списком: удалить, защитить, экспортировать или скопировать.", "Aktionen über der Liste: löschen, schützen, exportieren oder kopieren.", "Actions au-dessus de la liste : supprimer, protéger, exporter ou copier."],
  allProtected: ["These cookies are protected. Unprotect them first.", "Эти cookie защищены. Сначала снимите защиту.", "Diese Cookies sind geschützt. Heben Sie zuerst den Schutz auf.", "Ces cookies sont protégés. Retirez d’abord la protection."],
  confirmTitle: ["Are you sure?", "Точно?", "Sicher?", "Vous êtes sûr ?"],
  confirmDelete: ["Delete $1 cookies?", "Удалить cookie: $1?", "$1 Cookies löschen?", "Supprimer $1 cookies ?"],
  protectedCount: ["Protected cookies: $1.", "Защищено cookie: $1.", "Geschützte Cookies: $1.", "Cookies protégés : $1."],
  unprotectedCount: ["Protection removed: $1.", "Защита снята: $1.", "Schutz aufgehoben: $1.", "Protection retirée : $1."],
  saved: ["Saved.", "Сохранено.", "Gespeichert.", "Enregistré."],
  saveFailed: ["The browser didn’t accept the cookie: $1", "Браузер не принял cookie: $1", "Der Browser hat das Cookie abgelehnt: $1", "Le navigateur a refusé le cookie : $1"],
  discardChanges: ["Discard unsaved changes?", "Отменить несохранённые изменения?", "Ungespeicherte Änderungen verwerfen?", "Abandonner les modifications non enregistrées ?"],

  // Editor
  newCookie: ["New cookie", "Новый cookie", "Neues Cookie", "Nouveau cookie"],
  editCookie: ["Cookie", "Cookie", "Cookie", "Cookie"],
  unsaved: ["unsaved", "не сохранено", "nicht gespeichert", "non enregistré"],
  unsavedHint: ["Press Save or Ctrl+S", "Нажмите «Сохранить» или Ctrl+S", "Speichern oder Strg+S drücken", "Cliquez Enregistrer ou Ctrl+S"],
  fieldName: ["Name", "Имя", "Name", "Nom"],
  fieldValue: ["Value", "Значение", "Wert", "Valeur"],
  bytes: ["$1 bytes", "$1 байт", "$1 Bytes", "$1 octets"],
  urlDecode: ["URL decode", "URL → текст", "URL-dekodieren", "Décoder URL"],
  urlDecodeHint: ["%20 → space", "%20 → пробел", "%20 → Leerzeichen", "%20 → espace"],
  urlEncode: ["URL encode", "Текст → URL", "URL-kodieren", "Encoder URL"],
  b64Decode: ["Base64 decode", "Из Base64", "Base64 dekodieren", "Décoder Base64"],
  b64Encode: ["Base64 encode", "В Base64", "Base64 kodieren", "Encoder Base64"],
  valueToolFailed: ["This value can’t be decoded that way.", "Это значение так не раскодировать.", "Dieser Wert lässt sich so nicht dekodieren.", "Cette valeur ne peut pas être décodée ainsi."],
  jwtDecoded: ["JSON Web Token (decoded)", "JSON Web Token (расшифровка)", "JSON Web Token (dekodiert)", "JSON Web Token (décodé)"],
  fieldDomain: ["Domain", "Домен", "Domain", "Domaine"],
  fieldPath: ["Path", "Путь", "Pfad", "Chemin"],
  fieldIncludeSubdomains: ["Also send to subdomains", "Отправлять и поддоменам", "Auch an Subdomains senden", "Envoyer aussi aux sous-domaines"],
  fieldStore: ["Window / container", "Окно / контейнер", "Fenster / Container", "Fenêtre / conteneur"],
  fieldSameSite: ["SameSite", "SameSite", "SameSite", "SameSite"],
  sameSiteUnspecified: ["Not set (browser default)", "Не задан (как решит браузер)", "Nicht gesetzt (Browser-Standard)", "Non défini (par défaut)"],
  sameSiteLax: ["Lax", "Lax", "Lax", "Lax"],
  sameSiteStrict: ["Strict", "Strict", "Strict", "Strict"],
  sameSiteNone: ["None (cross-site)", "None (межсайтовый)", "None (seitenübergreifend)", "None (intersite)"],
  fieldExpires: ["Expires", "Истекает", "Läuft ab", "Expire"],
  fieldSession: ["Session cookie", "Сеансовый", "Sitzungs-Cookie", "Cookie de session"],
  fieldSecureHint: ["Sent over HTTPS only", "Только по HTTPS", "Nur über HTTPS", "Envoyé uniquement en HTTPS"],
  fieldHttpOnlyHint: ["Hidden from page scripts", "Недоступен скриптам страницы", "Für Seitenskripte unsichtbar", "Invisible pour les scripts de la page"],
  advanced: ["Advanced", "Дополнительно", "Erweitert", "Avancé"],
  fieldPartition: ["Partitioned for site", "Изолирован для сайта", "Partitioniert für Website", "Partitionné pour le site"],
  fieldPartitionHint: [
    "For cookies that a site stores while embedded in another site (Total Cookie Protection, CHIPS). Leave empty for normal cookies.",
    "Для cookie, которые сайт сохраняет, будучи встроенным в другой сайт (Total Cookie Protection, CHIPS). Для обычных cookie оставьте пустым.",
    "Für Cookies, die eine Website eingebettet in eine andere speichert (Total Cookie Protection, CHIPS). Für normale Cookies leer lassen.",
    "Pour les cookies qu’un site stocke lorsqu’il est intégré à un autre (Total Cookie Protection, CHIPS). Laisser vide sinon."
  ],
  fieldFirstParty: ["First-party domain (First-Party Isolation)", "Первичный домен (First-Party Isolation)", "Erstanbieter-Domain (First-Party Isolation)", "Domaine principal (First-Party Isolation)"],
  duplicate: ["Duplicate", "Дублировать", "Duplizieren", "Dupliquer"],
  duplicateHint: ["Make a copy to change and save separately", "Сделать копию, чтобы изменить и сохранить отдельно", "Kopie zum separaten Ändern anlegen", "Créer une copie à modifier séparément"],
  unprotectFirst: ["Protected: unprotect it first", "Защищён: сначала снимите защиту", "Geschützt: zuerst Schutz aufheben", "Protégé : retirez d’abord la protection"],
  errDomainRequired: ["Enter a domain.", "Укажите домен.", "Domain angeben.", "Indiquez un domaine."],
  errExpiresPast: ["The expiry date is in the past: the browser will delete the cookie at once.", "Дата истечения в прошлом: браузер сразу удалит cookie.", "Das Ablaufdatum liegt in der Vergangenheit: der Browser löscht das Cookie sofort.", "La date d’expiration est passée : le navigateur supprimera le cookie."],
  errPrefixSecure: ["Names starting with __Secure- or __Host- need Secure.", "Имена с __Secure- и __Host- требуют Secure.", "Namen mit __Secure- oder __Host- brauchen Secure.", "Les noms en __Secure- ou __Host- exigent Secure."],
  errHostPrefix: ["__Host- cookies need path / and no subdomains.", "Cookie с __Host- требуют путь / и без поддоменов.", "__Host--Cookies brauchen Pfad / und keine Subdomains.", "Les cookies __Host- exigent le chemin / sans sous-domaines."],
  errSameSiteNone: ["SameSite=None needs Secure.", "SameSite=None требует Secure.", "SameSite=None braucht Secure.", "SameSite=None exige Secure."],
  errPartitionedSecure: ["Partitioned cookies need Secure.", "Изолированным cookie нужен Secure.", "Partitionierte Cookies brauchen Secure.", "Les cookies partitionnés exigent Secure."],

  // Export / import
  exportTitle: ["Export cookies", "Экспорт cookie", "Cookies exportieren", "Exporter les cookies"],
  scopeSelected: ["Selected", "Выбранные", "Ausgewählte", "Sélectionnés"],
  scopeList: ["In the list", "В списке", "In der Liste", "De la liste"],
  scopeAll: ["All found", "Все найденные", "Alle gefundenen", "Tous les trouvés"],
  formatJson: ["JSON (Cookie-Editor, EditThisCookie)", "JSON (Cookie-Editor, EditThisCookie)", "JSON (Cookie-Editor, EditThisCookie)", "JSON (Cookie-Editor, EditThisCookie)"],
  formatNetscape: ["cookies.txt (curl, wget, yt-dlp)", "cookies.txt (curl, wget, yt-dlp)", "cookies.txt (curl, wget, yt-dlp)", "cookies.txt (curl, wget, yt-dlp)"],
  formatHeader: ["Cookie header (name=value; …)", "Заголовок Cookie (name=value; …)", "Cookie-Header (name=value; …)", "En-tête Cookie (name=value; …)"],
  formatCqm: ["JSON (Cookie Quick Manager)", "JSON (Cookie Quick Manager)", "JSON (Cookie Quick Manager)", "JSON (Cookie Quick Manager)"],
  format_json: ["JSON", "JSON", "JSON", "JSON"],
  format_netscape: ["cookies.txt", "cookies.txt", "cookies.txt", "cookies.txt"],
  format_cqm: ["Cookie Quick Manager", "Cookie Quick Manager", "Cookie Quick Manager", "Cookie Quick Manager"],
  format_playwright: ["Playwright", "Playwright", "Playwright", "Playwright"],
  exportWarning: [
    "Exported cookies can log anyone into your accounts. Keep them private.",
    "По экспортированным cookie кто угодно сможет войти в ваши аккаунты. Не передавайте их.",
    "Mit exportierten Cookies kann sich jeder in Ihre Konten einloggen. Halten Sie sie privat.",
    "Les cookies exportés permettent d’accéder à vos comptes. Gardez-les privés."
  ],
  importTitle: ["Import cookies", "Импорт cookie", "Cookies importieren", "Importer des cookies"],
  importHint: [
    "JSON from CookieTin, Cookie-Editor, EditThisCookie, Cookie Quick Manager or Playwright, or a cookies.txt file.",
    "JSON из CookieTin, Cookie-Editor, EditThisCookie, Cookie Quick Manager или Playwright либо файл cookies.txt.",
    "JSON aus CookieTin, Cookie-Editor, EditThisCookie, Cookie Quick Manager oder Playwright oder eine cookies.txt.",
    "JSON de CookieTin, Cookie-Editor, EditThisCookie, Cookie Quick Manager ou Playwright, ou un fichier cookies.txt."
  ],
  chooseFile: ["Choose file…", "Выбрать файл…", "Datei wählen…", "Choisir un fichier…"],
  orPaste: ["or paste the text below", "или вставьте текст ниже", "oder Text unten einfügen", "ou collez le texte ci-dessous"],
  importFound: ["Found $1 cookies ($2).", "Найдено cookie: $1 ($2).", "$1 Cookies gefunden ($2).", "$1 cookies trouvés ($2)."],
  importSkipped: ["Skipped (expired or unreadable): $1.", "Пропущено (истекли или не читаются): $1.", "Übersprungen (abgelaufen oder unlesbar): $1.", "Ignorés (expirés ou illisibles) : $1."],
  importUnreadable: ["Can’t read this text as cookies.", "Не получается прочитать это как cookie.", "Dieser Text lässt sich nicht als Cookies lesen.", "Impossible de lire ce texte comme des cookies."],
  importInto: ["Into", "Куда", "Nach", "Vers"],
  importKeepStores: ["Containers from the file", "Контейнеры из файла", "Container aus der Datei", "Conteneurs du fichier"],
  importProtect: ["Protect imported cookies", "Защитить импортированные cookie", "Importierte Cookies schützen", "Protéger les cookies importés"],
  importRun: ["Import $1", "Импортировать: $1", "$1 importieren", "Importer $1"],
  importedCount: ["Imported cookies: $1.", "Импортировано cookie: $1.", "Importierte Cookies: $1.", "Cookies importés : $1."],
  importFailed: ["Not accepted by the browser: $1.", "Браузер не принял: $1.", "Vom Browser abgelehnt: $1.", "Refusés par le navigateur : $1."],

  // Options
  optionsTitle: ["Settings", "Настройки", "Einstellungen", "Paramètres"],
  secCleanup: ["Automatic cleanup", "Автоматическая очистка", "Automatisches Aufräumen", "Nettoyage automatique"],
  optDeleteOnStartup: ["Delete cookies when the browser starts", "Удалять cookie при запуске браузера", "Cookies beim Browserstart löschen", "Supprimer les cookies au démarrage"],
  optDeleteOnStartupHint: ["Protected cookies stay, so you remain logged in where you want.", "Защищённые cookie останутся — вы не выйдете из нужных аккаунтов.", "Geschützte Cookies bleiben, Sie bleiben dort angemeldet.", "Les cookies protégés restent : vous restez connecté là où vous voulez."],
  optCleanup: ["Clean up regularly", "Регулярная очистка", "Regelmäßig aufräumen", "Nettoyer régulièrement"],
  cleanupOff: ["Off", "Выключена", "Aus", "Désactivé"],
  cleanupEvery: ["Every $1 h", "Каждые $1 ч", "Alle $1 Std.", "Toutes les $1 h"],
  optKeepOpenTabs: ["Keep cookies of sites open in tabs", "Не трогать cookie сайтов, открытых во вкладках", "Cookies offener Tabs behalten", "Garder les cookies des sites ouverts"],
  optKeepOpenTabsHint: ["So cleanup doesn’t log you out of what you are using now.", "Чтобы очистка не разлогинила вас там, где вы сейчас работаете.", "Damit Sie nicht aus gerade genutzten Seiten ausgeloggt werden.", "Pour ne pas être déconnecté des sites en cours d’utilisation."],
  cleanupNote: ["Protected cookies are never deleted by cleanup.", "Защищённые cookie очистка никогда не удаляет.", "Geschützte Cookies werden nie gelöscht.", "Les cookies protégés ne sont jamais supprimés."],
  secProtection: ["Protected cookies", "Защищённые cookie", "Geschützte Cookies", "Cookies protégés"],
  protectionText: [
    "Protected cookies survive CookieTin’s deletions and cleanups. Protect them in the manager (lock button).",
    "Защищённые cookie переживают удаление и очистку в CookieTin. Защитить cookie можно в менеджере (кнопка с замком).",
    "Geschützte Cookies überstehen Löschen und Aufräumen in CookieTin. Schützen im Manager (Schloss-Knopf).",
    "Les cookies protégés résistent aux suppressions et nettoyages de CookieTin. Protégez-les dans le gestionnaire (cadenas)."
  ],
  optGuard: ["Also restore them when a site or the browser deletes them", "Восстанавливать их, если сайт или браузер их удалит", "Auch wiederherstellen, wenn Website oder Browser sie löschen", "Les restaurer aussi si un site ou le navigateur les supprime"],
  optGuardHint: ["E.g. when a site logs you out by clearing its cookie.", "Например, когда сайт разлогинивает, стирая свой cookie.", "Z. B. wenn eine Website Sie durch Löschen ausloggt.", "Par ex. quand un site vous déconnecte en effaçant son cookie."],
  noProtected: ["No protected cookies yet.", "Защищённых cookie пока нет.", "Noch keine geschützten Cookies.", "Aucun cookie protégé pour l’instant."],
  unprotectDomain: ["Unprotect all cookies of this domain", "Снять защиту со всех cookie домена", "Schutz für alle Cookies der Domain aufheben", "Retirer la protection de tout le domaine"],
  secInterface: ["Interface", "Интерфейс", "Oberfläche", "Interface"],
  optOpenIn: ["Open the manager in", "Открывать менеджер", "Manager öffnen in", "Ouvrir le gestionnaire dans"],
  openTab: ["A tab", "Во вкладке", "einem Tab", "un onglet"],
  openWindow: ["Its own window", "В отдельном окне", "einem eigenen Fenster", "sa propre fenêtre"],
  optTheme: ["Theme", "Тема", "Design", "Thème"],
  themeAuto: ["As in the system", "Как в системе", "Wie das System", "Comme le système"],
  themeLight: ["Light", "Светлая", "Hell", "Clair"],
  themeDark: ["Dark", "Тёмная", "Dunkel", "Sombre"],
  optExportFormat: ["Default export format", "Формат экспорта по умолчанию", "Standard-Exportformat", "Format d’export par défaut"],
  optConfirm: ["Ask before deleting several cookies", "Спрашивать перед удалением нескольких cookie", "Vor dem Löschen mehrerer Cookies fragen", "Demander avant de supprimer plusieurs cookies"],
  optShowStoreDelete: ["Show “Delete all cookies” in the toolbar menu", "Показывать «Удалить все cookie» в меню кнопки", "„Alle Cookies löschen“ im Menü zeigen", "Afficher « Supprimer tous les cookies » dans le menu"],
  optShowStoreDeleteHint: ["Turn off if you tend to click it by accident.", "Выключите, если случайно на него нажимаете.", "Ausschalten, falls Sie es versehentlich anklicken.", "Désactivez si vous cliquez dessus par erreur."],
  optAutoRefresh: ["Update the manager live when cookies change", "Обновлять менеджер на лету при изменении cookie", "Manager bei Cookie-Änderungen live aktualisieren", "Mettre à jour le gestionnaire en direct"],
  secPrivate: ["Private windows", "Приватные окна", "Private Fenster", "Navigation privée"],
  privateAllowed: ["CookieTin can see the cookies of private windows while one is open.", "CookieTin видит cookie приватных окон, пока такое окно открыто.", "CookieTin sieht Cookies privater Fenster, solange eines offen ist.", "CookieTin voit les cookies privés tant qu’une fenêtre privée est ouverte."],
  privateHowFirefox: [
    "To manage private-window cookies, allow CookieTin there: Add-ons and themes → CookieTin → “Run in Private Windows”.",
    "Чтобы управлять cookie приватных окон, разрешите там CookieTin: «Дополнения и темы» → CookieTin → «Запуск в приватных окнах».",
    "Für Cookies privater Fenster CookieTin dort erlauben: Add-ons und Themes → CookieTin → „In privaten Fenstern ausführen“.",
    "Pour gérer les cookies privés, autorisez CookieTin : Modules complémentaires → CookieTin → « Exécution dans les fenêtres privées »."
  ],
  privateHowChrome: [
    "To manage Incognito cookies, open the extension’s details and turn on “Allow in Incognito”.",
    "Чтобы управлять cookie режима инкогнито, откройте сведения о расширении и включите «Разрешить в режиме инкогнито».",
    "Für Inkognito-Cookies in den Erweiterungsdetails „Im Inkognitomodus zulassen“ einschalten.",
    "Pour les cookies de navigation privée, activez « Autoriser en navigation privée » dans les détails de l’extension."
  ],
  secBackup: ["Backup", "Резервная копия", "Sicherung", "Sauvegarde"],
  backupText: ["Settings and the list of protected cookies (not the cookies themselves).", "Настройки и список защищённых cookie (сами cookie не сохраняются).", "Einstellungen und Liste geschützter Cookies (nicht die Cookies selbst).", "Paramètres et liste des cookies protégés (pas les cookies eux-mêmes)."],
  backupSave: ["Save to file", "Сохранить в файл", "In Datei speichern", "Enregistrer"],
  backupRestore: ["Restore from file…", "Восстановить из файла…", "Aus Datei wiederherstellen…", "Restaurer depuis un fichier…"],
  reset: ["Reset everything", "Сбросить всё", "Alles zurücksetzen", "Tout réinitialiser"],
  resetConfirm: ["Reset all settings and forget protected cookies?", "Сбросить настройки и забыть защищённые cookie?", "Alle Einstellungen zurücksetzen und geschützte Cookies vergessen?", "Réinitialiser les paramètres et oublier les cookies protégés ?"],
  resetDone: ["Everything is reset.", "Всё сброшено.", "Alles zurückgesetzt.", "Tout est réinitialisé."],
  restoreDone: ["Restored. Protected cookies in the file: $1.", "Восстановлено. Защищённых cookie в файле: $1.", "Wiederhergestellt. Geschützte Cookies in der Datei: $1.", "Restauré. Cookies protégés dans le fichier : $1."],
  restoreFailed: ["This file is not a CookieTin or Cookie Quick Manager backup.", "Это не резервная копия CookieTin или Cookie Quick Manager.", "Keine Sicherung von CookieTin oder Cookie Quick Manager.", "Ce fichier n’est pas une sauvegarde CookieTin ou Cookie Quick Manager."],
  migrateText: [
    "Moving from Cookie Quick Manager? In its settings click “Backup user data”, then restore that file here: your protected cookies and settings come along.",
    "Переходите с Cookie Quick Manager? В его настройках нажмите «Backup user data» и восстановите файл здесь: защищённые cookie и настройки перенесутся.",
    "Umstieg von Cookie Quick Manager? Dort „Benutzerdaten sichern“ klicken und die Datei hier wiederherstellen: geschützte Cookies und Einstellungen kommen mit.",
    "Vous venez de Cookie Quick Manager ? Dans ses paramètres, cliquez « Sauvegarder les données », puis restaurez le fichier ici."
  ],

  // Upgrade from Cookie Quick Manager
  welcomeTitle: ["Cookie Quick Manager is now CookieTin", "Cookie Quick Manager теперь называется CookieTin", "Cookie Quick Manager heißt jetzt CookieTin", "Cookie Quick Manager s’appelle désormais CookieTin"],
  welcomeText: [
    "The add-on was rewritten for current Firefox and renamed. Your settings and protected cookies were kept (protected cookies: $1).",
    "Дополнение переписано для современного Firefox и переименовано. Ваши настройки и защищённые cookie сохранены (защищённых cookie: $1).",
    "Das Add-on wurde für aktuelles Firefox neu geschrieben und umbenannt. Einstellungen und geschützte Cookies bleiben erhalten (geschützte Cookies: $1).",
    "Le module a été réécrit pour le Firefox actuel et renommé. Vos paramètres et cookies protégés sont conservés (cookies protégés : $1)."
  ],
  welcomeNew: [
    "New: the toolbar menu works again, partitioned cookies can be deleted, correct cookies.txt, multiple selection, Undo, dark theme and periodic cleanup.",
    "Новое: меню кнопки снова работает, изолированные cookie удаляются, правильный cookies.txt, выбор нескольких cookie, отмена удаления, тёмная тема и очистка по расписанию.",
    "Neu: das Menü funktioniert wieder, partitionierte Cookies lassen sich löschen, korrekte cookies.txt, Mehrfachauswahl, Rückgängig, dunkles Design und regelmäßiges Aufräumen.",
    "Nouveau : le menu fonctionne à nouveau, cookies partitionnés supprimables, cookies.txt correct, sélection multiple, Annuler, thème sombre et nettoyage régulier."
  ],
  welcomeOk: ["Got it", "Понятно", "Verstanden", "Compris"],
  welcomeChanges: ["All changes", "Все изменения", "Alle Änderungen", "Toutes les modifications"],

  // Support & about
  supportTitle: ["Support CookieTin", "Поддержать CookieTin", "CookieTin unterstützen", "Soutenir CookieTin"],
  supportText: [
    "CookieTin is free, open source and has no ads or tracking. If it saves you time, a donation helps keep it maintained.",
    "CookieTin бесплатный, открытый, без рекламы и слежки. Если он экономит вам время, донат поможет его развивать.",
    "CookieTin ist kostenlos, quelloffen, ohne Werbung und Tracking. Wenn es Ihnen Zeit spart, hilft eine Spende bei der Pflege.",
    "CookieTin est gratuit, libre, sans publicité ni pistage. S’il vous fait gagner du temps, un don aide à le maintenir."
  ],
  supportBoosty: ["Donate on Boosty", "Задонатить на Boosty", "Auf Boosty spenden", "Faire un don sur Boosty"],
  supportNetworkNote: ["Send only the listed coins in the listed network.", "Отправляйте только указанные монеты в указанной сети.", "Nur die genannten Coins im genannten Netzwerk senden.", "N’envoyez que les cryptos indiquées sur le réseau indiqué."],
  basedOn: ["Based on", "Основано на", "Basiert auf", "Basé sur"],
  byAuthor: ["by Ysard", "от Ysard", "von Ysard", "par Ysard"],
  privacy: ["Privacy", "Приватность", "Datenschutz", "Confidentialité"]
};

for (const [i, locale] of LOCALES.entries()) {
  const out = {};
  for (const [key, values] of Object.entries(M)) {
    if (values.length !== LOCALES.length) throw new Error(`${key}: expected ${LOCALES.length} translations`);
    const message = values[i];
    const entry = { message: message.replace(/\$(\d)/g, (_, n) => `$P${n}$`) };
    const nums = [...message.matchAll(/\$(\d)/g)].map(m => m[1]);
    if (nums.length) entry.placeholders = Object.fromEntries(nums.map(n => [`p${n}`, { content: `$${n}` }]));
    out[key] = entry;
  }
  await mkdir(new URL(`../src/_locales/${locale}/`, import.meta.url), { recursive: true });
  await writeFile(new URL(`../src/_locales/${locale}/messages.json`, import.meta.url), JSON.stringify(out, null, 2) + "\n");
}
console.log(`wrote ${Object.keys(M).length} strings × ${LOCALES.length} locales`);
