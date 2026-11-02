import json, os, sys

ROOT = 'C:/Users/mas/Arbeit/Esoterik-Welt'
man = json.load(open(ROOT + '/docs/kristalle/image-sources.json', encoding='utf-8'))
out = []
for c in man['crystals']:
    sel = [x for x in c['candidates'] if x.get('selected')]
    if len(sel) != 1:
        print('WARN selected count', c['crystal_id'], len(sel))
    s = sel[0]
    rend = s['source']['renditions']
    out.append({
        'id': c['crystal_id'],
        'slug': c['slug'],
        'name': c['display_name'],
        'target_path': c['target_path'],
        'page_url': s['source']['page_url'],
        'file_title': s['source']['file_title'],
        'w1280_url': rend['w1280']['url'],
        'w1280_sha256': rend['w1280']['sha256'],
        'w1280_bytes': rend['w1280']['bytes'],
        'w1280_w': rend['w1280']['delivered_width_px'],
        'w1280_h': rend['w1280']['delivered_height_px'],
        'original': s['original'],
        'author': s['author'],
        'license_name': s['license']['name'],
        'license_class': s['license']['class'],
        'license_url': s['license']['url'],
        'share_alike': s['license']['share_alike'],
        'requires_attribution': s['license']['requires_attribution'],
        'attribution_text_short': s['attribution_text_short'],
        'attribution_text_required': s['attribution_text_required'],
        'retrieved_at': s['retrieved_at'],
        'visual_note': s['visual_note'],
        'description_excerpt': s['description_excerpt'],
        'square_crop': s['square_crop'],
        'aspect_ratio': s['aspect_ratio'],
        'bg_class': s['background']['class'],
        'bg_lum': s['background']['measured_border_luminance'],
    })

json.dump(out, open(ROOT + '/docs/kristalle/.selection.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('entries:', len(out))
for e in out:
    print(f"{e['id']} {e['slug']:16s} {e['w1280_w']}x{e['w1280_h']:5d} ar={e['aspect_ratio']:.3f} sq={e['square_crop']:7s} bg={e['bg_class']:7s} lum={e['bg_lum']:5.1f} lic={e['license_class']}")
print()
print('integration_hints:', json.dumps(man.get('integration_hints'), ensure_ascii=False)[:1500])
print('statistics:', json.dumps(man.get('statistics'), ensure_ascii=False)[:800])
