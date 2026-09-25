# Visitor log → Google Sheet: one-time setup

The page sends each visitor to a small Google Apps Script that lives inside
your sheet and adds a row. Nothing secret is stored in this repo: the script's
web-app URL and your secret phrase are entered on each phone and stay there.

## 1. Add the script to the sheet (about 5 minutes, on a computer)

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Delete what's in `Code.gs`, paste in everything from
   [`Code.gs`](Code.gs) in this folder.
3. Change `SECRET` to a long random phrase of your own, e.g.
   `silver-stall-mango-7391-river`. **Don't commit your real phrase to this
   repo.** Only change it in the Apps Script editor.
4. Optional: set `SHEET_NAME` to a tab name. Blank means the first tab. Use an
   empty tab; the script writes the header row itself.
5. Click **Save**, then **Deploy → New deployment**.
   - Type (gear icon): **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and allow the permissions it asks for (Google will warn
     that the app isn't verified; choose *Advanced → Go to … (unsafe)*: it's
     your own script).
6. Copy the **Web app URL** (ends in `/exec`).

"Anyone" is needed because the page on each phone posts to it without a Google
login. The secret phrase is what stops strangers adding rows.

## 2. Set up each phone

Either open the page, expand **Google Sheet sync & settings** at the bottom,
paste the URL and the phrase, give the phone a name (e.g. *Counter 1*) and tap
**Test & sync now**.

Or build one setup link and send it privately (WhatsApp to your own staff,
not a public group):

```
https://calmcraft-devworld.github.io/silver-nakashhi-scanner/#sheet=<web app URL>&key=<secret phrase>&device=Counter%201
```

Opening it once saves the settings on that phone and removes them from the
address bar.

## What lands in the sheet

| Column | |
|---|---|
| Saved at | when the sheet received it |
| Visitor ID | used to update the same row on resend |
| Phone, Name / company | as confirmed on the phone |
| Interested in | the tapped interest buttons |
| Requirements / notes | free text |
| WhatsApp opened | Yes if the thank-you message was opened/copied |
| Scanned at (phone time) | when the visitor was started on the phone |
| Stall phone | the phone's name from settings |
| Text read from card | raw OCR text: handy for emails, addresses and names |

Visitors are saved when you tap **Open WhatsApp**, **Copy link**, **Save
visitor without WhatsApp** or **Next visitor**. With no signal they wait on the
phone ("3 waiting to send") and go through automatically when it's back.

## Not updating? Troubleshooting

On the phone, open **Google Sheet sync & settings** and tap **Test & sync now**.
It tells you exactly what's wrong. If the status line at the bottom says
"… waiting to send — tap for why", tap it for the same explanation.

| Message | Fix |
|---|---|
| *Sheet not set up* | Paste the Web app URL and the secret phrase in the settings panel on that phone. Each phone needs this once. |
| *Google asked for a login* / *couldn't reach the script* | Deploy → Manage deployments → ✏️ Edit → **Who has access: Anyone** (not "Anyone with a Google account", not "Only myself") → Version: New version → Deploy. |
| *that's the test (/dev) URL* | Use the **Web app** URL ending in `/exec` from Deploy → Manage deployments, not the one from "Test deployments". |
| *secret phrase doesn't match* | The phrase on the phone must match `SECRET` in Code.gs exactly (capitals, spaces). |
| *script replied with an error … not attached to a sheet* | The script was created outside the sheet. Either recreate it from the sheet's Extensions → Apps Script, or set `SPREADSHEET_ID` in Code.gs. |
| *script replied with an error* (anything else) | Make sure all of Code.gs was pasted, click Save, then Deploy → Manage deployments → Edit → **New version** → Deploy. Saving alone doesn't update the live web app. |

Rows go to the **first tab** of the sheet unless `SHEET_NAME` is set, so check
that tab.

## Changing the script later

After editing `Code.gs`, use **Deploy → Manage deployments → Edit → Version:
New version → Deploy**. That keeps the same URL, so phones don't need resetting.
