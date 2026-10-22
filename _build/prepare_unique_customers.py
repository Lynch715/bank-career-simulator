#!/usr/bin/env python3
"""Prepare one production portrait per customer name; keep retired source art."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
text = (ROOT / '_build/src/20-data.js').read_text()
names = json.loads(re.search(r'const CUST_NAMES = (\[[\s\S]*?\]);', text)[1])
types = json.loads(re.search(r'const CUST_TYPE_SEQ = (\[[\s\S]*?\]);', text)[1])
female = set('刘桂兰 杨淑芬 黄丽 吴晓燕 孙玉梅 胡秋菊 朱永红 郭春燕 谢红 梁晓敏 唐秀英 韩梅 曹玉兰 曾晓红 田秀珍 廖小琴 汪丽萍 熊春华 雷敏 袁淑华'.split())
# Each entry changes face shape, hair silhouette, clothing and hand pose.
looks = [
 ('long narrow face, prominent straight nose, close-cropped black hair, thin rectangular glasses', 'slate blue rolled-sleeve shirt, charcoal trousers', 'holding a closed cream laptop sleeve'),
 ('round face, soft cheeks, short rounded black bob with straight fringe, warm smile', 'dusty rose knitted cardigan, cream blouse, navy skirt', 'hands loosely clasped at waist'),
 ('angular heart-shaped face, fine arched eyebrows, shoulder-length wavy dark hair, focused gaze', 'ochre buttoned blouse and dark olive trousers', 'holding a small blank zipped purse'),
 ('square jaw, broad nose, medium tan skin, wavy side-combed black hair, small moustache', 'rust-brown casual jacket, ecru T-shirt, dark jeans', 'one hand resting on a canvas satchel strap'),
 ('oval face, high cheekbones, long black braid over shoulder, bright attentive eyes', 'teal patterned collarless blouse, beige trousers', 'holding a closed neutral sample book'),
 ('wide face, strong brow, thick short salt-and-pepper hair swept back, stocky build', 'dark chocolate casual blazer, forest green shirt, beige trousers', 'holding a closed leather document case'),
 ('older long face, pronounced smile lines, silver hair in low chignon, oval wire glasses', 'muted plum cardigan over cream floral blouse, grey trousers', 'holding a plain folded cloth shopping bag'),
 ('slender face, straight low eyebrows, textured black crew cut, tall lean build', 'pale blue short-sleeved office shirt, navy trousers, simple wristwatch', 'one hand holding a plain takeaway tumbler'),
 ('broad face, small smiling eyes, short wavy auburn-black hair, strong forearms', 'brick-red apron over cream striped long-sleeved top, dark trousers', 'holding a closed small order notebook'),
 ('older square face, bushy grey brows, short silver crew cut, visible laugh lines, sturdy build', 'moss green zip cardigan over pale check shirt, taupe trousers', 'hands lightly folded over a plain cloth pouch'),
 ('soft triangular face, fine freckles across cheeks, chin-length black hair tucked behind ears', 'warm blue round-neck knit top, grey pleated skirt', 'holding a folded ivory rain jacket'),
 ('diamond face, defined cheekbones, voluminous black curled bob, confident wide smile', 'muted burgundy pantsuit with ivory silk blouse, small pearl earrings', 'holding a structured tan handbag by handles'),
 ('older lean face, short white hair receding at temples, round rimless glasses, gentle smile', 'navy sleeveless knitted vest, ivory shirt, grey trousers', 'holding a closed blank newspaper folder'),
 ('older round face, short salt-and-pepper soft curls, plump cheeks, deep smile lines', 'ochre knitted cardigan, teal blouse, charcoal trousers', 'hands resting on a folded cloth tote'),
 ('older angular face, medium tan skin, grey flat-top hair, pronounced cheekbones, clean shaven', 'light taupe field jacket, dark navy polo shirt, brown trousers', 'holding a plain insulated steel flask'),
 ('slim oval face, slightly wide-set eyes, short pixie black cut with side fringe', 'sage green long-sleeved blouse, stone grey trousers', 'one palm open gently, other holding a closed slim notebook'),
 ('round face, slightly upturned nose, thick tousled dark hair, round dark glasses, broad build', 'muted ochre overshirt over white T-shirt, dark chinos', 'holding a closed blue laptop sleeve against hip'),
 ('long face, soft drooping brows, black hair in high bun, thoughtful smile', 'dusty lilac cardigan over ivory shirt, ink blue skirt', 'holding a small blank phone low at waist'),
 ('rectangular face, pronounced chin, thick eyebrows, black hair with shaved sides and wavy top', 'olive work jacket over cream henley shirt, brown trousers', 'holding a plain canvas tool roll closed'),
 ('broad oval face, confident narrow eyes, black hair in a low loose braid, sturdy build', 'warm mustard blouse, dark brown sleeveless vest, charcoal trousers', 'hands gently clasping a cloth market bag'),
 ('angular face, cropped black hair with greying temples, deep-set eyes, broad shoulders', 'muted midnight blue suit with open-collar light tan shirt', 'holding a thin blank portfolio under arm'),
 ('older heart-shaped face, visible wrinkles, silver chin-length bob, narrow oval spectacles', 'dusty pink Chinese-collar jacket, navy trousers, small jade brooch', 'holding a closed unmarked passbook sleeve'),
 ('narrow face, high forehead, neat side-parted dark hair, sharp straight brows, lean build', 'dark teal V-neck sweater over ivory shirt, stone trousers', 'holding a closed grey notebook with both hands'),
 ('square face, rounded nose, short straight black bob with blunt bangs, friendly small eyes', 'dusty blue denim jacket, cream apron tied at waist, dark trousers', 'one hand on a blank tan delivery pouch'),
 ('older round face, deep eye wrinkles, balding crown with grey side hair, relaxed smile', 'burgundy knitted vest over pale beige long-sleeve shirt, navy trousers', 'holding a wooden-handled folded umbrella'),
 ('heart-shaped face, small beauty mark below left eye, long dark hair in low ponytail', 'terracotta fine-knit cardigan, ivory blouse, olive skirt', 'holding a closed sage-green notebook'),
 ('broad rectangular face, salt-and-pepper buzz cut, thick brows, medium tan skin, sturdy build', 'charcoal casual jacket over muted gold polo shirt, dark trousers', 'hands resting lightly around a closed leather folder'),
 ('older oval face, deep smile lines, silver hair in tidy bun with single loose curl', 'dark teal quilted vest, beige cable-knit sweater, grey trousers', 'holding a plain soft cloth handbag'),
 ('older long face, arched grey brows, brushed-back white hair, thin grey moustache', 'warm brown cardigan, ivory collared shirt, slate trousers', 'holding a closed fabric spectacle case'),
 ('older square face, salt-and-pepper cropped curls, rounded cheeks, thin gold oval glasses', 'muted brick-red collarless jacket over cream blouse, charcoal trousers', 'holding an unmarked red zip wallet'),
 ('small angular face, narrow bright eyes, thick black curls, slim short build', 'pale sage short-sleeved shirt, charcoal vest, navy trousers', 'holding a closed slim dark laptop'),
 ('oval face, strong straight brows, shoulder-length dark hair with side fringe, composed gaze', 'muted petrol-blue blouse and cream cardigan, charcoal skirt', 'holding a small dark shoulder bag strap'),
 ('broad square face, short black spiky crop, faint stubble, athletic shoulders', 'navy polo shirt with grey casual jacket, stone chinos', 'holding a folded plain cycling jacket'),
 ('round face, short auburn-black curled bob, broad eyebrows, friendly open smile, solid build', 'warm olive apron over cream roll-sleeve shirt, dark trousers', 'holding a plain closed brown order ledger'),
 ('long face, prominent cheekbones, black side-part hair with white temple streak, wireframe glasses', 'slate-grey collarless jacket, tan knit shirt, dark trousers', 'holding a plain cloth messenger bag'),
 ('heart-shaped face, sharply arched brows, black hair in high ponytail, confident calm eyes', 'muted aubergine trouser suit, ivory blouse, gold stud earrings', 'holding a compact cream handbag'),
 ('older lean face, short grey swept-up hair, high cheekbones, slightly prominent ears', 'warm ochre windbreaker, pale blue polo, navy trousers', 'holding a plain closed folding fan at waist'),
 ('older softly squared face, silver short waved hair, deep-set lively eyes, light smile lines', 'slate blue knitted cardigan, cream blouse, grey trousers', 'holding a closed unmarked embroidered cloth purse'),
]
assert len(looks) == len(names) == 38
inventory_path = ROOT / 'assets/portraits/inventory.json'
data = json.loads(inventory_path.read_text())
retired = [c for c in data['characters'] if 'random-customer-archetype' in c['sources']]
data.setdefault('retiredArchetypes', retired)
data['characters'] = [c for c in data['characters'] if 'random-customer-archetype' not in c['sources'] and 'CUST_NAMES' not in c['sources']]
jobs = []
for i, (name, (face, outfit, pose)) in enumerate(zip(names, looks)):
    key = f'customer_person_{i+1:02d}'
    type_ = types[(i + 3) % len(types)]
    role = {'retire':'退休客户', 'worker':'上班族客户', 'self':'个体经营客户', 'boss':'企业主客户'}[type_]
    age = (61 + i % 12) if type_ == 'retire' else (28 + i % 17) if type_ == 'worker' else 36 + i % 18
    # The last name is reserved in the pool and has not yet appeared in a 40-card game.
    if i == 37:
        age = 65
        type_, role = 'retire', '退休客户'
    source = f'assets/portraits/source/{key}.png'
    data['characters'].append(dict(key=key, name=name, ids=[key], sources=['CUST_NAMES'], role=role, customerType=type_, sex='f' if name in female else 'm', note=f'{role}，专属人物形象。', status='pending', asset=source, visualAge=age, appearance=face, outfit=outfit, prop=pose))
    prompt = (
        'Use case: stylized-concept. Asset type: ONE production character standing portrait for the modern Chinese banking game 银行升职记. '
        'Use the input image ONLY as reference for clean Japanese anime / modern visual novel rendering style, thin elegant outlines and restrained cel shading. '
        'Create a completely NEW identity with a different face, hair silhouette, clothes, proportions and pose. Never copy the reference woman. '
        f'Subject: fictional Chinese {"woman" if name in female else "man"}, named {name}, age {age}, {role}. '
        f'Facial identity and build: {face}. Clothing: {outfit}. Hand pose: {pose}. '
        'Make the facial geometry and hair silhouette distinctive and legible at thumbnail size. Show the stated adult age honestly, including wrinkles and greying hair for retired people. '
        'Centered eye-level front three-quarter standing portrait from the ENTIRE hair to mid-thigh, both shoulders, elbows and hands inside frame. Tall 3:4 composition, minimal headroom 2-4 percent, natural believable anatomy. '
        'Real transparent alpha background, no scene, no ground, no halo or cast shadow. Muted natural garment colors matching a warm paper-and-ink interface. '
        'Exactly ONE person, no duplicates, no grid, no extra heads. No text, labels, watermark, logos or numbers; all personal objects blank. No bank uniform for customers. No photorealism, chibi, oversized eyes, glamour pose, or identical-face template.'
    )
    jobs.append(dict(key=key, name=name, prompt=prompt, source=source, reference='assets/portraits/source/customer_worker_f.png'))
data.update(namedCount=108, assetCount=110, coverageNote='70 位原有角色、38 位客户姓名池人物各自使用专属立绘，另有 2 张玩家形象。8 张客户模板已退役，不再参与运行映射。')
inventory_path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
(ROOT/'assets/portraits/unique-customer-prompts-v2.json').write_text(json.dumps(dict(tool='built-in image_gen', transparent_background=True, jobs=jobs), ensure_ascii=False, indent=2)+'\n')
print(f'Prepared {len(jobs)} unique customers; {len(retired)} shared templates retired.')
