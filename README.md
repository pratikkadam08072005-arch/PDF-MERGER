# Paperfold document tools

A hostable Flask website for merging and converting documents:

- Merge PDF files
- Convert PDF to Word
- Convert Word to PDF
- Convert images to PDF
- Convert images to Word
- Edit PDF pages by removing and rotating them
- Edit DOCX text
- Edit images with rotation, brightness, and contrast

## Run locally

```powershell
python -m pip install -r requirements.txt
python server.py
```

Open `http://127.0.0.1:5000`.

## Publish the website step by step

1. Install Git from `https://git-scm.com/downloads` and create a GitHub account.
2. In this project folder, open PowerShell and run:

```powershell
git init
git add .
git commit -m "Build Paperfold document tools"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/paperfold.git
git push -u origin main
```

3. Create a new repository named `paperfold` on GitHub before running the `git remote` command.
4. Create an account at `https://render.com` or another Docker-compatible host.
5. Choose **New Web Service**, connect the GitHub repository, and select **Docker** as the runtime.
6. Choose a service name such as `paperfold`, select a region, and deploy. The included `Dockerfile` installs LibreOffice, so Word to PDF works on the hosted service.
7. Open the HTTPS URL provided by the host and test every tool. Do not use the local `127.0.0.1` URL for public sharing.
8. Add a custom domain in the host dashboard if you want a branded address such as `pdf.yourdomain.com`.
9. Open Google Search Console at `https://search.google.com/search-console`, add the deployed domain, and verify ownership.
10. In Search Console, open **Sitemaps**, submit `https://YOUR-DOMAIN.com/sitemap.xml`, then use **URL inspection** and request indexing for the homepage.

Google may take days or weeks to index a new site. Search visibility cannot be guaranteed immediately, but the site is prepared with metadata, schema markup, crawler rules, and a sitemap.

## Deploy

Use a Python host that supports a `Procfile` (Render, Railway, Fly.io, or a Linux VM). The app uses the `PORT` environment variable and starts with Gunicorn.

Word to PDF requires LibreOffice on the host. On Debian or Ubuntu:

```bash
sudo apt-get update && sudo apt-get install -y libreoffice
```

Set the service start command to the Procfile command or run:

```bash
gunicorn --bind 0.0.0.0:$PORT server:app
```

Uploaded files are held in memory or temporary directories and are not persisted by the app.

The editors are intentionally lightweight: the PDF editor changes page structure and can place text on a selected page, the Word editor replaces document text with the text entered in the editor, and the image editor applies basic image adjustments and can place text on the image.

## Google visibility

Deploy the app on a public HTTPS domain before requesting indexing. The site includes SEO metadata, schema markup, `robots.txt`, and a dynamic `sitemap.xml`. After deployment, submit `https://your-domain.com/sitemap.xml` in Google Search Console and request indexing for the homepage. Google controls when the page appears in search results; no local server can be indexed while it runs on `127.0.0.1`.
