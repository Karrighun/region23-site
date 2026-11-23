#!/usr/bin/env python3
"""Импорт новостей, фото и видео из публичного Telegram-канала на сайт.

Читает веб-превью канала (https://t.me/s/<канал>), разбирает посты и пишет в папку data сайта:
  news.json   — посты с текстом: заголовок, текст, рубрика, обложка, видео;
  media.json  — все фото и видео канала (в т.ч. посты без текста) для раздела «Медиа»;
  img/        — фото в том размере, который отдаёт Telegram (до 800–1280 px по длинной стороне);
  video/      — ролики mp4 целиком + кадр-обложка из самого ролика (нужен ffmpeg; без него берётся превью Telegram).
Превью видео меньше MIN_W пикселей на сайт не выводятся — они размытые.

Запуск:  python tools/tg_news.py                                   (XKREGION23 → adult/site/data)
         python tools/tg_news.py --channel hk_region23_kids --out kids/site/data
На хостинге: cron каждые 15 минут для обоих каналов, например
         */15 * * * * cd /var/www/region23 && python3 tools/tg_news.py && python3 tools/tg_news.py --channel hk_region23_kids --out kids/site/data
Без зависимостей — только стандартная библиотека Python 3.8+ (ffmpeg по желанию).
"""
import argparse, html, json, os, re, shutil, struct, subprocess, sys, time, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'adult', 'site', 'data')
UA = {'User-Agent': 'Mozilla/5.0 (compatible; region23-site/1.0)'}
MIN_W = 400            # меньше — не показываем (размытое превью)
MAX_VIDEO = 40 << 20   # ролики крупнее 40 МБ не скачиваем, ведём на пост в Telegram

RUBRICS = [
    ('Клуб', r'день рожден|поздравля|с праздник|с днём|с днем'),
    ('Матчи', r'сч[её]т|побед|матч|буллит|шайб|период|плей-офф|кубок|лиг[аи]|финал|\d+\s*:\s*\d+'),
    ('Академия', r'академи|детск|юн(ых|ые)|садик|кэмп|camp|сбор[ыа]|малыш'),
]
SKIP = re.compile(r'анонимный вопрос|^\s*$')
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️‍]')
BG = r"background-image:url\('([^']+)'\)"


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()


def clean(t):
    t = re.sub(r'<br\s*/?>', '\n', t)
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    t = EMOJI.sub('', t)
    t = re.sub(r'[—–-]{4,}.*$', '', t, flags=re.S)
    t = re.sub(r'@XKREGION23|💬?\s*МЫ В МАХ', '', t)
    t = re.sub(r'[ \t]+', ' ', t)
    return re.sub(r'\n{3,}', '\n\n', t).strip()


def title_and_body(text):
    lines = [l.strip(' .!') for l in text.split('\n') if l.strip()]
    if not lines:
        return '', ''
    title = lines[0]
    if len(title) > 90:
        title = re.split(r'(?<=[.!?])\s', title)[0][:90].rstrip(' ,.') + ('…' if len(lines[0]) > 90 else '')
    body = ' '.join(lines[1:]) if len(lines) > 1 else ''
    return title.rstrip('.'), body[:320]


def jpeg_size(path):
    """(ширина, высота) JPEG без Pillow; None если не удалось."""
    try:
        with open(path, 'rb') as f:
            if f.read(2) != b'\xff\xd8':
                return None
            while True:
                b = f.read(1)
                while b and b != b'\xff':
                    b = f.read(1)
                while b == b'\xff':
                    b = f.read(1)
                if not b:
                    return None
                if b[0] in (0xC0, 0xC1, 0xC2):
                    f.read(3)
                    h, w = struct.unpack('>HH', f.read(4))
                    return w, h
                f.seek(struct.unpack('>H', f.read(2))[0] - 2, 1)
    except Exception:
        return None


def parse(page, channel):
    posts = []
    for m in re.finditer(r'data-post="%s/(\d+)"(.*?)(?=data-post="|$)' % channel, page, re.S):
        pid, blk = int(m.group(1)), m.group(2)
        tm = re.search(r'tgme_widget_message_text[^>]*>(.*?)</div>', blk, re.S)
        text = clean(tm.group(1)) if tm else ''
        dt = re.search(r'datetime="([^"]+)"', blk)
        views = re.search(r'tgme_widget_message_views">([^<]+)<', blk)
        photos = re.findall(r'tgme_widget_message_photo_wrap[^>]*' + BG, blk)
        videos = []  # пары (mp4 или None, превью)
        for vm in re.finditer(r'tgme_widget_message_video_player(.*?)(?=tgme_widget_message_video_player|tgme_widget_message_text|tgme_widget_message_footer|$)', blk, re.S):
            vb = vm.group(1)
            src = re.search(r'<video[^>]*src="([^"]+)"', vb)
            th = re.search(r'tgme_widget_message_video_thumb[^>]*' + BG, vb)
            du = re.search(r'message_video_duration[^>]*>([^<]+)<', vb)
            if src or th:
                videos.append((html.unescape(src.group(1)) if src else None, th.group(1) if th else None,
                               du.group(1).strip() if du else ''))
        title, body = title_and_body(text)
        posts.append({'id': pid, 'date': dt.group(1) if dt else '', 'title': title, 'text': body, 'raw': text,
                      'rubric': next((r for r, rx in RUBRICS if re.search(rx, text, re.I)), 'Клуб'),
                      'url': f'https://t.me/{channel}/{pid}', 'views': views.group(1) if views else '',
                      '_photos': photos, '_videos': videos})
    return posts


def save(url, rel):
    path = os.path.join(OUT_DIR, rel)
    if not os.path.exists(path):
        data = get(url)
        open(path, 'wb').write(data)
    return path


def poster_from(mp4, rel):
    """Кадр из ролика (секунда 1) в полном разрешении. Нужен ffmpeg."""
    path = os.path.join(OUT_DIR, rel)
    if os.path.exists(path):
        return True
    ff = shutil.which('ffmpeg')
    if not ff:
        return False
    r = subprocess.run([ff, '-v', 'error', '-ss', '1', '-i', mp4, '-frames:v', '1', '-q:v', '3', '-y', path])
    return r.returncode == 0 and os.path.exists(path)


def compress(vpath):
    """Пережимает ролик для сайта: не шире 720 px, H.264 CRF 28, звук AAC 96k, быстрый старт. Нужен ffmpeg."""
    ff = shutil.which('ffmpeg')
    if not ff or vpath.endswith('.web.mp4'):
        return
    tmp = vpath + '.tmp.mp4'
    r = subprocess.run([ff, '-v', 'error', '-y', '-i', vpath, '-vf', "scale='min(720,iw)':-2", '-c:v', 'libx264',
                        '-preset', 'veryfast', '-crf', '28', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', tmp])
    if r.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) < os.path.getsize(vpath):
        os.replace(tmp, vpath)
    elif os.path.exists(tmp):
        os.remove(tmp)


def collect(p):
    """Скачивает медиа поста, возвращает список элементов {type, src, poster, w, h}."""
    out = []
    for k, u in enumerate(p.pop('_photos')):
        try:
            path = save(u, f'img/{p["id"]}_{k}.jpg')
        except Exception as e:
            print('нет фото', p['id'], e, file=sys.stderr); continue
        wh = jpeg_size(path) or (0, 0)
        if max(wh) >= MIN_W:
            out.append({'type': 'photo', 'src': f'data/img/{p["id"]}_{k}.jpg', 'w': wh[0], 'h': wh[1]})
    for k, (mp4, th, dur) in enumerate(p.pop('_videos')):
        item = {'type': 'video', 'src': None, 'poster': None, 'thumb': None, 'dur': dur, 'w': 0, 'h': 0}
        if mp4:
            try:
                vpath = os.path.join(OUT_DIR, f'video/{p["id"]}_{k}.mp4')
                if not os.path.exists(vpath):
                    req = urllib.request.urlopen(urllib.request.Request(mp4, headers=UA), timeout=120)
                    if int(req.headers.get('Content-Length') or 0) <= MAX_VIDEO:
                        open(vpath, 'wb').write(req.read())
                        compress(vpath)
                if os.path.exists(vpath):
                    item['src'] = f'data/video/{p["id"]}_{k}.mp4'
                    if poster_from(vpath, f'video/{p["id"]}_{k}.jpg'):
                        item['poster'] = f'data/video/{p["id"]}_{k}.jpg'
            except Exception as e:
                print('нет видео', p['id'], e, file=sys.stderr)
        if not item['poster'] and th:
            try:
                path = save(th, f'img/{p["id"]}_v{k}.jpg')
                wh = jpeg_size(path) or (0, 0)
                if max(wh) >= MIN_W:
                    item['poster'] = f'data/img/{p["id"]}_v{k}.jpg'
                elif not item['src']:
                    # длинное видео: Telegram отдаёт только маленькую обложку — сайт показывает её в родном размере
                    item['thumb'] = f'data/img/{p["id"]}_v{k}.jpg'
                    item['w'], item['h'] = wh
            except Exception:
                pass
        if item['poster']:
            item['w'], item['h'] = jpeg_size(os.path.join(OUT_DIR, item['poster'][5:])) or (0, 0)
        if item['src'] or item['poster'] or item['thumb']:
            out.append(item)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--channel', default='XKREGION23')
    ap.add_argument('--limit', type=int, default=40, help='сколько постов с текстом в news.json')
    ap.add_argument('--pages', type=int, default=8, help='сколько страниц ленты (по ~20 постов) читать')
    ap.add_argument('--out', default=None, help='папка data сайта (по умолчанию adult/site/data)')
    a = ap.parse_args()
    global OUT_DIR
    if a.out:
        OUT_DIR = os.path.abspath(a.out)
    for d in ('img', 'video'):
        os.makedirs(os.path.join(OUT_DIR, d), exist_ok=True)
    seen, posts, before = set(), [], None
    for _ in range(a.pages):
        page = get(f'https://t.me/s/{a.channel}' + (f'?before={before}' if before else '')).decode('utf-8', 'ignore')
        ids = [int(x) for x in re.findall(r'data-post="%s/(\d+)"' % a.channel, page)]
        if not ids:
            break
        for p in parse(page, a.channel):
            if p['id'] not in seen:
                seen.add(p['id']); posts.append(p)
        if before is not None and min(ids) >= before:
            break
        before = min(ids); time.sleep(.3)
    posts.sort(key=lambda p: -p['id'])
    news, media = [], []
    for p in posts:
        p['tgvideo'] = bool(p['_videos'])  # было видео в посте (даже если слишком длинное для превью)
        items = collect(p)
        for it in items:
            media.append(dict(it, post=p['url'], date=p['date'], caption=p['title']))
        raw = p.pop('raw')
        if SKIP.search(raw) or len(raw) < 25 or len(news) >= a.limit:
            continue
        cover = next((i for i in items if i['type'] == 'photo'), None) or next((i for i in items if i['type'] == 'video'), None)
        p['image'] = (cover['src'] if cover['type'] == 'photo' else cover['poster']) if cover else None
        p['video'] = cover['src'] if cover and cover['type'] == 'video' else None
        p['thumb'] = cover.get('thumb') if cover and not p['image'] else None
        p['dur'] = cover.get('dur', '') if cover else ''
        p['w'], p['h'] = (cover['w'], cover['h']) if cover else (0, 0)
        p['count'] = len(items)
        news.append(p)
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    json.dump({'channel': a.channel, 'updated': now, 'items': news},
              open(os.path.join(OUT_DIR, 'news.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump({'channel': a.channel, 'updated': now, 'items': media},
              open(os.path.join(OUT_DIR, 'media.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'ok: {len(news)} news, {len(media)} media '
          f'({sum(m["type"] == "video" for m in media)} video) -> {OUT_DIR}')


if __name__ == '__main__':
    main()
