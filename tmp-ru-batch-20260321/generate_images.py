
import os, json, ssl, urllib.request, urllib.parse, time
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
from io import BytesIO
import boto3

ARTICLES = {
  "luchshie-besplatnye-ii-generatory-video-2026": [
    ("cover", "A clean hand-drawn doodle illustration for a blog article about the best free AI video generators in 2026. A large ranking board with 12 video tool cards, play buttons, stars, arrows, comparison badges, and a #1 badge for Seedance. Minimalist whiteboard sketch style, black ink on light cream white background, casual hand-drawn feel with small decorative elements. Professional blog header illustration style."),
    ("tools-grid", "A clean hand-drawn doodle illustration showing a grid of AI video generator tools being compared, with small monitor screens, play icons, ranking numbers, and checkmarks. Minimalist whiteboard sketch style, black ink on light cream background, simple and clean."),
    ("decision", "A clean hand-drawn doodle illustration showing a decision tree for choosing an AI video generator: creator, marketing, TikTok, cinematic, beginner. With arrows, stars, video icons, and comparison labels. Minimalist whiteboard sketch style, black ink on light cream background, simple and clean.")
  ],
  "seedance-2-0-vs-kling-ai-sravnenie": [
    ("cover", "A clean hand-drawn doodle illustration for a comparison article between Seedance 2.0 and Kling AI. Two large panels facing each other with labels, video frames, play icons, speed, pricing, and quality comparison symbols. Minimalist whiteboard sketch style, black ink on light cream white background, casual hand-drawn feel with small decorative elements. Professional blog header illustration style."),
    ("workflow", "A clean hand-drawn doodle illustration showing text-to-video and image-to-video workflow comparison, with prompt box, image card, video output frames, arrows, and labels for speed and control. Minimalist whiteboard sketch style, black ink on light cream background, simple and clean."),
    ("decision", "A clean hand-drawn doodle illustration showing a decision matrix between Seedance 2.0 and Kling AI, with columns for ads, TikTok, speed, consistency, motion, and workflow. Minimalist whiteboard sketch style, black ink on light cream background, simple and clean.")
  ],
  "kak-sozdat-video-iz-teksta-besplatno-ii": [
    ("cover", "A clean hand-drawn doodle illustration for a tutorial about creating video from text with AI for free. A prompt box turning into a video frame with arrows, sparkles, play icons, and a simple step-by-step layout. Minimalist whiteboard sketch style, black ink on light cream white background, casual hand-drawn feel with small decorative elements. Professional blog header illustration style."),
    ("prompt-guide", "A clean hand-drawn doodle illustration showing the formula of a good text-to-video prompt: subject, action, scene, light, style, camera, format. With boxes, arrows, and small video icons. Minimalist whiteboard sketch style, black ink on light cream background, simple and clean."),
    ("workflow", "A clean hand-drawn doodle illustration showing a step-by-step AI video workflow: idea, prompt, generate, compare, refine, export. With numbered steps, arrows, and video thumbnails. Minimalist whiteboard sketch style, black ink on light cream background, simple and clean.")
  ]
}

for path in ['/root/.openclaw/workspace/.env.vms','/root/seedance/.env.local']:
    with open(path) as f:
        for line in f:
            line=line.strip()
            if not line or line.startswith('#') or '=' not in line: continue
            k,v=line.split('=',1)
            os.environ[k]=v.strip().strip('"').strip("'")

api_key=os.environ['BYTEPLUS_API_KEY']
endpoint='https://ark.ap-southeast.bytepluses.com/api/v3/images/generations'
model='ep-20260115153505-w288q'
outdir=Path('/root/seedance/tmp-ru-batch-20260321/images')
outdir.mkdir(parents=True, exist_ok=True)

s3 = boto3.client('s3',
    endpoint_url='https://037a0c886060490ecda55ce7bd76ce10.r2.cloudflarestorage.com',
    aws_access_key_id=os.environ['STORAGE_ACCESS_KEY'],
    aws_secret_access_key=os.environ['STORAGE_SECRET_KEY'],
    region_name='apac'
)
ctx=ssl.create_default_context()

results={}
for slug, items in ARTICLES.items():
    results[slug]={}
    for name, prompt in items:
        req=urllib.request.Request(endpoint, data=json.dumps({
            'model': model,
            'prompt': prompt,
            'size': '2560x1440',
            'response_format': 'url',
            'watermark': False
        }).encode(), method='POST')
        req.add_header('Authorization', f'Bearer {api_key}')
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req, context=ctx, timeout=120) as r:
            data=json.load(r)
        url=data['data'][0]['url']
        with urllib.request.urlopen(url, context=ctx, timeout=120) as r:
            raw=r.read()
        img=Image.open(BytesIO(raw)).convert('RGB')
        target=(1312,736)
        img=ImageOps.fit(img, target, method=Image.Resampling.LANCZOS)
        local=outdir/f'{slug}-{name}.jpeg'
        img.save(local, format='JPEG', quality=75, optimize=True)
        key=f'blog/{slug}-{name}.jpeg'
        s3.upload_file(str(local), 'seedance', key, ExtraArgs={'ContentType':'image/jpeg','CacheControl':'public, max-age=31536000'})
        results[slug][name]=f'https://r2.seedance.tv/{key}'
        time.sleep(1)
Path('/root/seedance/tmp-ru-batch-20260321/image-results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(json.dumps(results, ensure_ascii=False, indent=2))
