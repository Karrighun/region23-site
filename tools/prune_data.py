"""Удаляет из data/img и data/video файлы, на которые больше не ссылаются news.json и media.json."""
import json, os, sys
for d in sys.argv[1:]:
    used = set()
    for fn in ('news.json', 'media.json'):
        p = os.path.join(d, fn)
        if os.path.exists(p):
            for it in json.load(open(p, encoding='utf-8')).get('items', []):
                for k in ('image', 'video', 'src', 'poster', 'thumb'):
                    if it.get(k): used.add(os.path.normpath(it[k].replace('data/', '', 1)))
    n = 0
    for sub in ('img', 'video'):
        for f in os.listdir(os.path.join(d, sub)) if os.path.isdir(os.path.join(d, sub)) else []:
            rel = os.path.normpath(os.path.join(sub, f))
            if rel not in used: os.remove(os.path.join(d, rel)); n += 1
    print(d, 'удалено', n)
