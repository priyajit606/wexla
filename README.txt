WEXLA FIXED BUILD

Files:
- index.html
- style.css
- script.js

Main fixes:
- Registered users persist in localStorage until browser/site storage is manually cleared.
- Login works with saved username OR email + exact password.
- Removed all built-in/default incoming missions.
- Website, PPT, Video Editing, Making Apps and Making 2D Games briefs create persistent incoming missions in IndexedDB.
- Mission cards open a detailed overlay with description, email, contact number, budget and idea thumbnail when supplied.
- Apps and 2D Games briefs accept an optional idea image.
- Nature photo uploads now use IndexedDB with automatic image compression, avoiding localStorage quota failures.
- Photo gallery supports preview/search/download.
- Added touch controls for games on phones while keyboard controls remain on laptops.
- Responsive game canvas/modal/layout for phones and laptops.

Important:
This is still a frontend-only/local-first build. Browser localStorage/IndexedDB is per browser/device. For a real public website where different people on different phones/laptops share the same accounts, missions and photos, connect a backend database + file storage (for example Supabase/Firebase) instead of browser-only storage.
