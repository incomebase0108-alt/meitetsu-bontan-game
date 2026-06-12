"""
名鉄ボンタン狩り 駅ボス/アーキタイプ スプライト生成 (4号機 / Blender 5.1)

昭和ヤンキー(リーゼント+特攻服)のアニメ調・右向き idle 立ち絵を
透過PNG(560x1000, キャラ高さ約800px, 足裏=画像最下端)でレンダリングする。
ブロック調禁止 → 球/カプセル+サブサーフの有機形状 + Freestyle輪郭線。

usage:
  blender -b -P tools/build_yankee.py -- --only shin-anjo
  blender -b -P tools/build_yankee.py -- --only shin-anjo --out C:/tmp/preview.png
  blender -b -P tools/build_yankee.py -- --all
"""
import bpy, math, sys, os

argv = sys.argv
argv = argv[argv.index("--") + 1:] if "--" in argv else []
ONLY = None
OUT_OVERRIDE = None
ALL = False
ZOOM = None
POSE = "idle"   # idle | idle2 | idle3 | atk | hit | grd
POSES_ALL = ("idle", "idle2", "idle3", "atk", "hit", "grd")
POSE_SUFFIX = {"idle": "", "idle2": "_2", "idle3": "_3", "atk": "_atk", "hit": "_hit", "grd": "_grd"}
i = 0
while i < len(argv):
    if argv[i] == "--only":
        ONLY = argv[i + 1]; i += 2
    elif argv[i] == "--out":
        OUT_OVERRIDE = argv[i + 1]; i += 2
    elif argv[i] == "--all":
        ALL = True; i += 1
    elif argv[i] == "--zoom":          # 頭部確認用: --zoom 0.6 1.65
        ZOOM = (float(argv[i + 1]), float(argv[i + 2])); i += 3
    elif argv[i] == "--frame":         # 後方互換: --frame 2 = --pose idle2
        POSE = "idle2" if argv[i + 1] == "2" else "idle"; i += 2
    elif argv[i] == "--pose":          # idle/idle2/idle3/atk/hit/grd
        POSE = argv[i + 1]; i += 2
    else:
        i += 1

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR_DIR = os.path.join(ROOT, "assets", "characters")
BOSS_DIR = os.path.join(CHAR_DIR, "boss")
os.makedirs(BOSS_DIR, exist_ok=True)

D = math.radians

def C(r, g, b): return (r, g, b, 1.0)

PAL = {
    "skin":      C(0.91, 0.71, 0.55),
    "white":     C(0.94, 0.93, 0.92),
    "offwhite":  C(0.82, 0.81, 0.80),
    "black":     C(0.07, 0.07, 0.09),
    "coal":      C(0.13, 0.13, 0.16),
    "hair_blk":  C(0.08, 0.08, 0.10),
    "hair_sil":  C(0.72, 0.74, 0.80),
    "gold":      C(0.86, 0.66, 0.15),
    "gold_dk":   C(0.60, 0.43, 0.09),
    "purple":    C(0.31, 0.13, 0.44),
    "purple_dk": C(0.17, 0.07, 0.26),
    "dgreen":    C(0.10, 0.28, 0.15),
    "dgreen_dk": C(0.05, 0.16, 0.08),
    "eye_w":     C(0.96, 0.96, 0.94),
    "iris":      C(0.18, 0.10, 0.06),
    "mouth":     C(0.30, 0.11, 0.10),
    "teeth":     C(0.93, 0.91, 0.86),
    "wood":      C(0.30, 0.18, 0.09),
    "wood_lt":   C(0.74, 0.60, 0.40),
    "scar":      C(0.74, 0.47, 0.39),
    "steel":     C(0.75, 0.78, 0.82),
    "tattoo":    C(0.13, 0.30, 0.36),
    "red":       C(0.70, 0.12, 0.10),
}

_mc = {}
def mat(name, color, metallic=0.0, rough=0.85):
    k = (name, color, metallic, round(rough, 2))
    if k in _mc: return _mc[k]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = color
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    _mc[k] = m; return m


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blocks in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.lights, bpy.data.cameras):
        for b in list(blocks):
            if b.users == 0:
                blocks.remove(b)
    _mc.clear()


def root():
    bpy.ops.object.empty_add(location=(0, 0, 0))
    return bpy.context.active_object


def _common(o, material, parent, rot, subsurf):
    if rot is not None:
        o.rotation_euler = (D(rot[0]), D(rot[1]), D(rot[2]))
    if subsurf:
        ss = o.modifiers.new("ss", "SUBSURF"); ss.levels = 2; ss.render_levels = 2
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    if parent is not None:
        o.parent = parent
    return o


def sph(loc, r, material, scale=(1, 1, 1), rot=None, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.active_object
    o.scale = scale
    return _common(o, material, parent, rot, False)


def cyl(loc, r1, r2, depth, material, rot=None, scale=(1, 1, 1), parent=None):
    """r1=下端半径, r2=上端半径 の先細り円柱 (cone primitive)"""
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, location=loc, vertices=24)
    o = bpy.context.active_object
    o.scale = scale
    return _common(o, material, parent, rot, True)


def seg(a, b, ra, rb, material, parent=None, scale=(1, 1, 1)):
    """点a→点b を結ぶ円柱 (関節間のリンク)"""
    mx = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
    dx, dy, dz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    L = math.sqrt(dx * dx + dy * dy + dz * dz)
    rot_y = math.degrees(math.atan2(math.hypot(dx, dy), dz))
    rot_z = math.degrees(math.atan2(dy, dx))
    return cyl(mx, ra, rb, L, material, rot=(0, rot_y, rot_z), scale=scale, parent=parent)


def box(loc, scale, material, rot=None, parent=None, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    if bevel > 0:
        bv = o.modifiers.new("bv", "BEVEL"); bv.width = bevel; bv.segments = 3
    return _common(o, material, parent, rot, False)


def torus(loc, R, r, material, rot=None, scale=(1, 1, 1), parent=None):
    bpy.ops.mesh.primitive_torus_add(location=loc, major_radius=R, minor_radius=r,
                                     major_segments=36, minor_segments=12)
    o = bpy.context.active_object
    o.scale = scale
    return _common(o, material, parent, rot, False)


def tube(points, depth, material, parent=None):
    """NURBS曲線+ベベルのチューブ(刺繍・入れ墨等)"""
    cu = bpy.data.curves.new("tube", "CURVE")
    cu.dimensions = "3D"
    spl = cu.splines.new("NURBS")
    spl.points.add(len(points) - 1)
    for j, p in enumerate(points):
        spl.points[j].co = (p[0], p[1], p[2], 1.0)
    spl.use_endpoint_u = True
    spl.order_u = 3
    cu.bevel_depth = depth
    cu.bevel_resolution = 4
    cu.use_fill_caps = True
    o = bpy.data.objects.new("tube", cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    if parent is not None:
        o.parent = parent
    return o


# ============================================================
# 体パーツ
# ============================================================

def fist(p, loc, r=0.050):
    skin = mat("skin", PAL["skin"])
    sph(loc, r, skin, scale=(1.0, 0.85, 1.1), parent=p)
    sph((loc[0] + r * 0.45, loc[1], loc[2] + r * 0.1), r * 0.72, skin, scale=(0.9, 0.8, 1.0), parent=p)


def face(p, cz, r, cfg):
    """顔: 三白眼の睨み・極太の八の字眉・眉間の皺・への字大口+食いしばり・エラ顎・青髭・傷"""
    skin = mat("skin", PAL["skin"])
    skin_dk = mat("skin_dk", C(0.72, 0.52, 0.40), 0, 0.85)
    ew = mat("eye_w", PAL["eye_w"], 0, 0.35)
    ir = mat("iris", PAL["iris"], 0, 0.3)
    brow = mat("brow", cfg.get("brow", cfg["hair"]), 0, 0.7)
    # 顎: 大きく角ばったエラ + 突き出る顎先
    sph((r * 0.10, 0, cz - r * 0.55), r * 0.86, skin, scale=(1.00, 0.90, 0.78), parent=p)
    for sy in (1, -1):  # エラの角
        sph((r * 0.02, sy * r * 0.60, cz - r * 0.58), r * 0.30, skin, parent=p)
    sph((r * 0.80, 0, cz - r * 0.88), r * 0.26, skin, scale=(0.9, 0.85, 0.7), parent=p)  # 顎先
    # 頬骨 (高く張る)
    for sy in (1, -1):
        sph((r * 0.42, sy * r * 0.58, cz + r * 0.04), r * 0.27, skin, parent=p)
    # 青髭 (顎まわりの剃り跡。口より奥に収める)
    sph((r * 0.26, 0, cz - r * 0.76), r * 0.58, skin_dk, scale=(0.70, 0.78, 0.44), parent=p)
    # 鼻: 喧嘩鼻 (低く幅広)
    sph((r * 0.96, 0, cz - r * 0.18), r * 0.165, skin, scale=(0.95, 0.80, 0.95), parent=p)
    sph((r * 0.88, 0, cz + r * 0.04), r * 0.10, skin, scale=(0.9, 0.6, 1.5), parent=p)
    # 目: 細い三白眼スリット + 上目遣いの睨み (sunglasses指定なら角型バイザー)
    for sy in (1, -1):
        th = D(27)
        ex, ey = r * math.cos(th) * 0.90, sy * r * math.sin(th) * 1.40
        ez = cz + r * 0.10
        if not cfg.get("sunglasses"):
            sph((ex, ey, ez), r * 0.21, ew, scale=(0.36, 0.95, 0.50), rot=(sy * -10, 0, sy * 14), parent=p)
            sph((ex + r * 0.065, ey - sy * r * 0.02, ez + r * 0.015), r * 0.10, ir, scale=(0.45, 0.85, 1.0), parent=p)
            # 重い上まぶた (目の上半分を潰す)
            box((ex + r * 0.04, ey + sy * r * 0.01, ez + r * 0.105), (r * 0.10, r * 0.28, r * 0.075),
                mat("lid", C(0.45, 0.30, 0.22), 0, 0.7), rot=(sy * -26, 4, sy * 14), parent=p, bevel=0.006)
        # 極太の八の字眉 (目に密着・急角度)
        box((ex + r * 0.035, ey + sy * r * 0.03, ez + r * 0.26), (r * 0.155, r * 0.40, r * 0.13),
            brow, rot=(sy * -30, 6, sy * 17), parent=p, bevel=0.012)
    # 眉間の縦皺 x2
    for sy in (1, -1):
        box((r * 0.95, sy * r * 0.065, cz + r * 0.30), (r * 0.045, r * 0.028, r * 0.15),
            skin_dk, rot=(sy * 6, -12, 0), parent=p, bevel=0.004)
    if cfg.get("sunglasses"):
        # 角型の黒バイザー (任侠系。丸より角ばらせて凄みを出す) + テンプル
        lens = mat("lens", C(0.03, 0.03, 0.045), 0.35, 0.12)
        box((r * 0.80, 0, cz + r * 0.10), (r * 0.30, r * 1.45, r * 0.36), lens, parent=p, bevel=0.015)
        for sy in (1, -1):
            box((r * 0.55, sy * r * 0.74, cz + r * 0.11), (r * 0.14, r * 0.34, r * 0.34), lens,
                rot=(0, 0, sy * 35), parent=p, bevel=0.012)
            seg((r * 0.30, sy * r * 0.88, cz + r * 0.10), (-r * 0.05, sy * r * 0.94, cz + r * 0.02),
                r * 0.045, r * 0.035, lens, parent=p)
    # 口: 大きいへの字 + 食いしばった歯 + 下がり切った口角
    mz = cz - r * 0.64
    box((r * 0.78, 0, mz), (r * 0.055, r * 0.42, r * 0.115), mat("mouth", PAL["mouth"], 0, 0.5),
        rot=(0, 10, 0), parent=p, bevel=0.008)
    box((r * 0.805, 0, mz + r * 0.005), (r * 0.045, r * 0.33, r * 0.06), mat("teeth", PAL["teeth"], 0, 0.4),
        rot=(0, 10, 0), parent=p, bevel=0.005)
    for sy in (1, -1):
        box((r * 0.70, sy * r * 0.245, mz + r * 0.095), (r * 0.05, r * 0.13, r * 0.055),
            mat("mouth", PAL["mouth"], 0, 0.5), rot=(sy * 40, 0, 0), parent=p, bevel=0.006)
        # ほうれい線 (鼻横→口角)
        box((r * 0.82, sy * r * 0.30, cz - r * 0.42), (r * 0.035, r * 0.028, r * 0.24),
            skin_dk, rot=(sy * 16, -8, 0), parent=p, bevel=0.004)
    # 耳
    for sy in (1, -1):
        sph((-r * 0.06, sy * r * 0.94, cz - r * 0.10), r * 0.24, skin, scale=(0.55, 0.35, 0.85), parent=p)
    # 頬傷 (カメラ側・大きく)
    if cfg.get("scar"):
        for k in range(4):
            box((r * 0.50, -r * 0.76, cz - r * (0.04 + 0.16 * k)), (r * 0.13, r * 0.030, r * 0.045),
                mat("scar", PAL["scar"], 0, 0.6), rot=(0, -16, -10), parent=p, bevel=0.004)
    # 額の向こう傷 (X字。skinhead等の凶相用)
    if cfg.get("face_scar_x"):
        sc = mat("scar", PAL["scar"], 0, 0.6)
        for a in (32, -32):
            box((r * 0.66, -r * 0.46, cz + r * 0.62), (r * 0.035, r * 0.26, r * 0.05),
                sc, rot=(a, -28, -18), parent=p, bevel=0.004)


def pompadour(p, cz, r, cfg):
    """リーゼント: 前方ロール+トップ+後頭部スリック+もみあげ"""
    h = mat("hair", cfg["hair"], 0, 0.5)
    vol = cfg.get("pompadour", 1.0)
    # 前方ロール本体 (額の上から前へ大きく突き出す。眉より必ず上)
    sph((r * 1.10, 0, cz + r * 1.02), r * 0.62 * vol, h,
        scale=(1.70, 0.78, 0.85), rot=(0, -10, 0), parent=p)
    # ロール先端の丸み (前でくるんと下に巻く)
    sph((r * (1.62 + 0.38 * vol), 0, cz + r * 0.70), r * 0.44 * vol, h,
        scale=(0.88, 0.66, 1.00), rot=(0, 30, 0), parent=p)
    # トップ〜後頭部 (スリックバック・頭頂のみ)
    sph((-r * 0.12, 0, cz + r * 0.66), r * 0.95, h, scale=(1.00, 0.95, 0.70), parent=p)
    sph((-r * 0.55, 0, cz + r * 0.05), r * 0.75, h, scale=(0.65, 0.90, 0.95), parent=p)
    # 後ろのダックテール
    cyl((-r * 1.00, 0, cz - r * 0.28), r * 0.14, r * 0.03, r * 0.42, h, rot=(0, 128, 0), parent=p)
    # サイドの刈り上げ・もみあげ
    for sy in (1, -1):
        sph((r * 0.02, sy * r * 0.88, cz + r * 0.34), r * 0.34, h, scale=(0.90, 0.36, 0.80), parent=p)
        box((r * 0.30, sy * r * 0.87, cz - r * 0.26), (r * 0.10, r * 0.045, r * 0.26), h,
            rot=(0, 5, 0), parent=p, bevel=0.008)
    # 額の生え際
    box((r * 0.72, 0, cz + r * 0.64), (r * 0.15, r * 0.56, r * 0.10), h, rot=(0, -34, 0), parent=p, bevel=0.012)


def skinhead_tattoo(p, cz, r):
    """坊主頭の龍の入れ墨: 首筋→側頭部→頭頂へ這う青墨の龍"""
    tat = mat("tattoo", PAL["tattoo"], 0, 0.75)
    pts = []
    n = 12
    for k in range(n):
        t = k / (n - 1)
        a = D(-115 + 38 * math.sin(t * math.pi * 1.6))      # 側頭部〜後頭部(-Y)のみを蛇行
        zz = cz - r * 0.85 + t * r * 1.55                    # 首筋から頭頂手前へ
        rr = r * (1.00 if t > 0.3 else 0.62)
        # 頭球(scale 0.95,0.92,1.04)の表面に沿わせる
        pts.append((rr * 0.95 * math.cos(a) * 0.62, rr * 0.92 * math.sin(a), zz))
    tube(pts, r * 0.052, tat, parent=p)
    # 龍頭 (側頭部・こめかみ後ろ)
    hx, hy, hz = pts[-1]
    sph((hx, hy, hz + r * 0.04), r * 0.14, tat, scale=(1.4, 0.6, 0.75), rot=(0, -15, -35), parent=p)


def head(p, cfg, sh_z, r):
    skin = mat("skin", PAL["skin"])
    cz = sh_z + r * 1.58
    sph((0, 0, cz), r, skin, scale=(0.95, 0.92, 1.04), parent=p)
    cyl((0.005, 0, sh_z + r * 0.40), r * 0.48, r * 0.52, r * 1.15, skin, parent=p)  # 極太の首
    face(p, cz, r, cfg)
    if cfg.get("skinhead"):
        # 坊主頭: 地肌より僅かに暗い剃り跡 + 入れ墨 + 顎髭
        buzz = mat("buzz", C(0.80, 0.62, 0.49), 0, 0.8)
        sph((-r * 0.04, 0, cz + r * 0.30), r * 0.97, buzz, scale=(0.97, 0.94, 0.92), parent=p)
        skinhead_tattoo(p, cz, r)
        goatee = mat("goatee", C(0.16, 0.13, 0.11), 0, 0.7)
        sph((r * 0.82, 0, cz - r * 0.94), r * 0.20, goatee, scale=(0.92, 0.75, 0.58), parent=p)
    else:
        pompadour(p, cz, r, cfg)
    return cz


def bontan(p, cfg, hip_z, knee_z, bulk):
    """ボンタン: 腿で膨らみ裾で絞るシルエット + しわ + 黒靴"""
    pc = mat("pants", cfg["pants"], 0, 0.9)
    pd = mat("pants_dk", cfg["pants_dk"], 0, 0.9)
    shoe = mat("shoe", PAL["black"], 0.1, 0.4)
    ankle = 0.052
    stance = 0.115
    for sy in (1, -1):
        y = sy * stance
        # 腰→ふくらはぎ (太く)
        cyl((0.0, y, (hip_z + knee_z * 0.5) / 2 + 0.02), 0.090, 0.125 * bulk, hip_z - knee_z * 0.5,
            pc, rot=(sy * 3, 0, 0), parent=p)
        # ふくらはぎ→裾 (一気に絞る)
        cyl((0.0, y * 1.08, knee_z * 0.40), 0.115 * bulk, ankle, knee_z * 0.80, pc,
            rot=(sy * 1.2, 0, 0), parent=p)
        # 裾・腿のしわ
        for k in range(2):
            torus((0.0, y * 1.08, knee_z * 0.30 - k * 0.06), 0.072 + 0.014 * k, 0.009, pd,
                  scale=(1, 1, 0.6), parent=p)
        # 靴 (先がやや尖る)
        sph((0.09, y * 1.08, 0.048), 0.094, shoe, scale=(1.75, 0.60, 0.50), parent=p)
        sph((0.21, y * 1.08, 0.045), 0.042, shoe, scale=(1.3, 0.75, 0.75), parent=p)


def body_tattoo(p, sh_w, sh_z, hip_z):
    """上半身の和彫り: 龍の胴巻き(太)+二重コイル+波・雲文様+肩当て彫り(カメラ側)"""
    tat = mat("tattoo", PAL["tattoo"], 0, 0.75)
    tat_r = mat("tattoo_r", C(0.55, 0.16, 0.12), 0, 0.75)   # 紅差し
    # 龍の胴: 脇腹→胸→肩へ太く巻きつく
    pts = []
    n = 16
    for k in range(n):
        t = k / (n - 1)
        z = hip_z + 0.05 + t * (sh_z - hip_z)
        a = D(-30 - 65 * t + 30 * math.sin(t * math.pi * 2.2))
        rr = sh_w * (0.70 + 0.24 * t)
        pts.append((rr * 0.62 * math.cos(a), rr * math.sin(a), z))
    tube(pts, 0.019, tat, parent=p)
    # 二重コイル (腹に巻く下段)
    pts2 = []
    for k in range(10):
        t = k / 9.0
        z = hip_z + 0.04 + t * 0.10
        a = D(40 - 150 * t)
        rr = sh_w * 0.70
        pts2.append((rr * 0.62 * math.cos(a), rr * math.sin(a), z))
    tube(pts2, 0.015, tat, parent=p)
    # 龍頭 (カメラ側の鎖骨上・大きく) + 角 + 紅の目
    hx, hy, hz = sh_w * 0.28, -sh_w * 0.62, sh_z + 0.02
    sph((hx, hy, hz), 0.052, tat, scale=(1.5, 0.65, 0.85), rot=(0, -18, -35), parent=p)
    for sy in (1, -1):
        cyl((hx - 0.02, hy + sy * 0.026, hz + 0.06), 0.008, 0.002, 0.06, tat, rot=(sy * 18, -18, 0), parent=p)
    sph((hx + 0.045, hy - 0.02, hz + 0.018), 0.009, tat_r, parent=p)
    # 波文様 (脇腹・カメラ側に半円弧を重ねる)
    for k in range(3):
        zz = hip_z + 0.10 + k * 0.085
        torus((sh_w * (0.30 - 0.06 * k), -sh_w * (0.78 - 0.04 * k), zz), 0.040, 0.0095, tat,
              rot=(78, -16, 20 + 10 * k), parent=p)
    # 雲の渦 (胸上部と腹)
    torus((sh_w * 0.50, -sh_w * 0.30, sh_z - 0.16), 0.026, 0.008, tat, rot=(0, 78, 0), parent=p)
    torus((sh_w * 0.52, -sh_w * 0.18, hip_z + 0.13), 0.022, 0.0075, tat_r, rot=(0, 80, 15), parent=p)
    # 肩当て彫り (カメラ側の三角筋を覆う環+放射)
    dy = -sh_w * 0.92
    torus((0.01, dy, sh_z + 0.035), sh_w * 0.30, 0.011, tat, rot=(8, 6, 0), scale=(0.95, 0.85, 1), parent=p)
    for a in (-30, 10, 50):
        box((0.01 + math.cos(D(a)) * sh_w * 0.20, dy - 0.015, sh_z - 0.05 + math.sin(D(a)) * sh_w * 0.18),
            (0.045, 0.012, 0.016), tat, rot=(0, a, 0), parent=p, bevel=0.004)


def bare_torso(p, cfg, hip_z, sh_z, sh_w, bulk):
    """上半身裸: 筋肉質の素肌 + 大胸筋 + 腹筋 + 入れ墨。腰はボンタンのベルト"""
    skin = mat("skin", PAL["skin"])
    skin_dk = mat("skin_dk", C(0.82, 0.60, 0.45), 0, 0.85)
    # 胴 (逆三角)
    cyl((0, 0, (hip_z + sh_z) / 2 + 0.02), sh_w * 0.60 * bulk, sh_w * 0.86, (sh_z - hip_z) + 0.10,
        skin, scale=(0.62, 1, 1), parent=p)
    # 大胸筋 (デカく)
    for sy in (1, -1):
        sph((sh_w * 0.40, sy * sh_w * 0.38, sh_z - 0.115), sh_w * 0.34, skin, scale=(0.62, 0.95, 0.72), parent=p)
    # 僧帽筋
    sph((-sh_w * 0.24, 0, sh_z - 0.05), sh_w * 0.48, skin, scale=(0.60, 1.00, 0.60), parent=p)
    # 腹筋 (3段x2列・しっかり浮き出す)
    for row in range(3):
        for sy in (1, -1):
            az = hip_z + 0.085 + row * 0.075
            fr = sh_w * (0.58 - 0.04 * row)
            sph((fr * 0.66, sy * sh_w * 0.17, az), 0.046, skin, scale=(0.62, 0.85, 0.78), parent=p)
    # 腹斜筋の影ライン
    for sy in (1, -1):
        box((sh_w * 0.30, sy * sh_w * 0.34, hip_z + 0.16), (0.012, 0.012, 0.10), skin_dk,
            rot=(sy * 12, 0, 0), parent=p, bevel=0.004)
    # ベルト+バックル (ボンタンの腰)
    cyl((0, 0, hip_z + 0.015), sh_w * 0.62 * bulk, sh_w * 0.60 * bulk, 0.055,
        mat("belt", PAL["black"], 0.1, 0.5), scale=(0.66, 1, 1), parent=p)
    sph((sh_w * 0.40, 0, hip_z + 0.015), 0.026, mat("buckle", PAL["gold"], 0.7, 0.3),
        scale=(0.5, 1.1, 1.0), parent=p)
    body_tattoo(p, sh_w, sh_z, hip_z)


def tokkofuku(p, cfg, hip_z, sh_z, sh_w, bulk):
    """特攻服/長ラン: 胴+ロングスカート+詰襟+金ボタン"""
    cc = mat("coat", cfg["coat"], 0, 0.9)
    cd = mat("coat_dk", cfg["coat_dk"], 0, 0.9)
    gold = mat("gold", PAL["gold"], 0.7, 0.35)
    inner = mat("inner", cfg.get("inner", PAL["black"]), 0, 0.8)
    hem_z = cfg.get("hem_z", 0.46)
    # 胴 (逆三角: 肩広く腰すぼむ)
    cyl((0, 0, (hip_z + sh_z) / 2 + 0.02), sh_w * 0.66 * bulk, sh_w * 0.88, (sh_z - hip_z) + 0.10,
        cc, scale=(0.62, 1, 1), parent=p)
    # 大胸筋
    for sy in (1, -1):
        sph((sh_w * 0.38, sy * sh_w * 0.36, sh_z - 0.10), sh_w * 0.30, cc, scale=(0.60, 0.90, 0.70), parent=p)
    # 背中(僧帽筋)
    sph((-sh_w * 0.26, 0, sh_z - 0.06), sh_w * 0.50, cc, scale=(0.60, 1.00, 0.60), parent=p)
    # ロング裾 (膝まで・下に向かってフレア)
    cyl((0, 0, (hip_z + hem_z) / 2 + 0.02), sh_w * 0.95, sh_w * 0.64 * bulk, (hip_z - hem_z) + 0.08,
        cc, scale=(0.70, 1, 1), parent=p)
    # 裾の折り返し
    torus((0, 0, hem_z + 0.01), sh_w * 0.86, 0.013, cd, scale=(0.71, 1, 0.75), parent=p)
    # 前合わせ縦ライン (胸/裾で面に沿わせて分割)
    box((sh_w * 0.50, 0.012, (hip_z + sh_z) / 2), (0.013, 0.011, (sh_z - hip_z) * 0.46),
        cd, rot=(0, -6, 0), parent=p, bevel=0.004)
    box((sh_w * 0.58, 0.012, (hip_z + hem_z) / 2), (0.013, 0.011, (hip_z - hem_z) * 0.46),
        cd, rot=(0, 7, 0), parent=p, bevel=0.004)
    # 金ボタン5個 (胸の面に沿って)
    for k in range(5):
        t = k / 4.0
        bz = sh_z - 0.07 - t * (sh_z - hip_z - 0.02)
        fr = sh_w * (0.54 - 0.06 * t) * (0.62 / 0.62)
        sph((fr * 1.02, 0.030, bz), 0.0155, gold, parent=p)
    # 詰襟 (立ち襟・内側黒・金パイピング)
    col_r = sh_w * 0.36
    cyl((0.005, 0, sh_z + 0.05), col_r * 1.16, col_r * 1.22, 0.09, cc, parent=p)
    cyl((0.005, 0, sh_z + 0.08), col_r * 1.00, col_r * 1.04, 0.05, inner, parent=p)
    torus((0.005, 0, sh_z + 0.095), col_r * 1.14, 0.0075, gold, scale=(1, 1, 0.7), parent=p)


def arm(p, cfg, sy, sh_z, sh_w, bulk, pose):
    """pose: 'down'=脇に下ろし拳 / 'shoulder'=体側で前腕を立て肩担ぎグリップ / 'grip'=前で杖を握る
    戻り値: 拳の位置"""
    bare = cfg.get("shirtless")
    cc = mat("skin", PAL["skin"]) if bare else mat("coat", cfg["coat"], 0, 0.9)
    gold = mat("gold", PAL["gold"], 0.7, 0.35)
    ring = (lambda *a, **kw: None) if bare else torus  # 袖口の金線は裸では描かない
    y0 = sy * sh_w * 0.92
    sh_pos = (0.01, y0, sh_z - 0.015)
    sph(sh_pos, sh_w * 0.34 * bulk, cc, scale=(0.92, 0.80, 0.92), parent=p)  # 三角筋
    if pose == "shoulder":
        elbow = (0.075, y0 * 1.10, sh_z - 0.295)
        f = (0.155, y0 * 1.02, sh_z + 0.055)
        seg(sh_pos, elbow, 0.075 * bulk, 0.060 * bulk, cc, parent=p)
        sph(elbow, 0.064 * bulk, cc, parent=p)
        seg(elbow, (f[0], f[1], f[2] - 0.02), 0.058 * bulk, 0.048, cc, parent=p)
        ring((f[0] - 0.018, f[1], f[2] - 0.085), 0.050, 0.008, gold, rot=(0, 8, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "swing":
        # 振り下ろし: 腕を前へ伸ばし切る
        elbow = (0.16, y0 * 1.02, sh_z - 0.155)
        f = (0.355, y0 * 0.82, sh_z - 0.065)
        seg(sh_pos, elbow, 0.075 * bulk, 0.060 * bulk, cc, parent=p)
        sph(elbow, 0.064 * bulk, cc, parent=p)
        seg(elbow, (f[0] - 0.015, f[1], f[2]), 0.058 * bulk, 0.048, cc, parent=p)
        ring((f[0] - 0.075, f[1], f[2] - 0.035), 0.050, 0.008, gold, rot=(0, 65, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "back":
        # 攻撃の反対腕: 後ろへ振る
        elbow = (-0.085, y0 * 1.16, sh_z - 0.255)
        f = (-0.155, y0 * 1.18, sh_z - 0.510)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.062 * bulk, cc, parent=p)
        seg(elbow, (f[0], f[1], f[2] + 0.025), 0.054 * bulk, 0.045, cc, parent=p)
        ring((f[0] + 0.01, f[1], f[2] + 0.08), 0.048, 0.008, gold, rot=(0, -14, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "flail":
        # 被弾: 腕が跳ね上がる
        elbow = (0.045, y0 * 1.18, sh_z - 0.235)
        f = (0.145, y0 * 1.20, sh_z + 0.020)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.062 * bulk, cc, parent=p)
        seg(elbow, (f[0] - 0.01, f[1], f[2] - 0.02), 0.054 * bulk, 0.045, cc, parent=p)
        ring((f[0] - 0.03, f[1], f[2] - 0.075), 0.048, 0.008, gold, rot=(0, 20, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "hold":
        # ガード: 体の前で武器を縦に握る
        elbow = (0.105, y0 * 1.05, sh_z - 0.275)
        f = (0.275, y0 * 0.60, sh_z - 0.185)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.062 * bulk, cc, parent=p)
        seg(elbow, f, 0.055 * bulk, 0.046, cc, parent=p)
        ring((f[0] - 0.05, f[1] + sy * 0.018, f[2] + 0.012), 0.048, 0.008, gold,
             rot=(0, 75, sy * -16), parent=p)
        fist(p, f)
        return f
    elif pose == "grip":
        elbow = (0.10, y0 * 1.06, sh_z - 0.27)
        f = (0.27, y0 * 0.66, sh_z - 0.30)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.062 * bulk, cc, parent=p)
        seg(elbow, f, 0.055 * bulk, 0.046, cc, parent=p)
        ring((f[0] - 0.045, f[1] + sy * 0.02, f[2] + 0.012), 0.048, 0.008, gold,
              rot=(0, 78, sy * -18), parent=p)
        fist(p, f)
        return f
    else:  # down
        elbow = (0.015, y0 * 1.22, sh_z - 0.30)
        f = (0.040, y0 * 1.24, sh_z - 0.585)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.062 * bulk, cc, parent=p)
        seg(elbow, (f[0], f[1], f[2] + 0.03), 0.054 * bulk, 0.045, cc, parent=p)
        ring((f[0] - 0.012, f[1], f[2] + 0.085), 0.048, 0.008, gold, parent=p)
        fist(p, f)
        return f


# ============================================================
# 武器
# ============================================================

def _shoulder_dir():
    """武器の軸方向 (ポーズで変化)。idleは肩担ぎ後上方=顔に被らない"""
    d = {
        "idle":  (-0.85, -0.05, 0.52),
        "idle2": (-0.81, -0.05, 0.57),
        "idle3": (-0.77, -0.05, 0.62),
        "atk":   (0.55, -0.06, -0.62),   # 前下へ振り下ろした瞬間
        "hit":   (-0.55, -0.05, -0.72),  # 後ろ下へだらんと落ちる
        "grd":   (0.05, -0.02, 1.00),    # 体の前で縦に構える
    }[POSE]
    n = math.sqrt(sum(x * x for x in d))
    return tuple(x / n for x in d)


def _along(grip, dirv, t):
    return tuple(grip[k] + dirv[k] * t for k in range(3))


def _rots(dirv):
    rot_y = math.degrees(math.atan2(math.hypot(dirv[0], dirv[1]), dirv[2]))
    rot_z = math.degrees(math.atan2(dirv[1], dirv[0]))
    return rot_y, rot_z


def weapon_bat_gold(p, grip):
    """金色の金属バット (肩担ぎ)"""
    gold = mat("bat", PAL["gold"], 0.85, 0.25)
    gdk = mat("bat_dk", PAL["gold_dk"], 0.8, 0.35)
    dirv = _shoulder_dir()
    rot_y, rot_z = _rots(dirv)
    L = 0.90
    cyl(_along(grip, dirv, L * 0.40 - 0.08), 0.026, 0.050, L, gold, rot=(0, rot_y, rot_z), parent=p)
    sph(_along(grip, dirv, L * 0.90 - 0.08), 0.050, gold, parent=p)
    sph(_along(grip, dirv, -0.12), 0.033, gdk, scale=(1, 1, 0.55), rot=(0, rot_y, rot_z), parent=p)
    for k in range(3):
        torus(_along(grip, dirv, -0.045 + 0.045 * k), 0.029, 0.0055, gdk, rot=(0, rot_y, rot_z), parent=p)


def weapon_bokuto(p, grip):
    """豪華な木刀: 黒漆+金鍔 (肩担ぎ)"""
    lac = mat("bokuto", C(0.13, 0.09, 0.06), 0.2, 0.35)
    gold = mat("gold", PAL["gold"], 0.7, 0.3)
    dirv = _shoulder_dir()
    rot_y, rot_z = _rots(dirv)
    L = 0.92
    cyl(_along(grip, dirv, L * 0.42 - 0.08), 0.027, 0.042, L, lac, scale=(1, 0.55, 1), rot=(0, rot_y, rot_z), parent=p)
    sph(_along(grip, dirv, L * 0.92 - 0.08), 0.038, lac, scale=(1, 0.55, 1.5), rot=(0, rot_y, rot_z), parent=p)
    cyl(_along(grip, dirv, 0.085), 0.068, 0.068, 0.018, gold, rot=(0, rot_y, rot_z), parent=p)
    for k in range(2):
        torus(_along(grip, dirv, -0.02 - 0.055 * k), 0.023, 0.0055, gold, rot=(0, rot_y, rot_z), parent=p)


def weapon_guandao(p, grip):
    """青龍刀(中華大刀): 幅広の反り刀身+金口金+柄尻リング+赤房 (肩担ぎ)"""
    steel = mat("blade", PAL["steel"], 0.9, 0.25)
    gold = mat("gold", PAL["gold"], 0.7, 0.3)
    grip_m = mat("grip", C(0.16, 0.10, 0.07), 0, 0.6)
    red = mat("tassel", PAL["red"], 0, 0.7)
    dirv = _shoulder_dir()
    rot_y, rot_z = _rots(dirv)
    # 柄
    cyl(_along(grip, dirv, 0.06), 0.020, 0.022, 0.46, grip_m, rot=(0, rot_y, rot_z), parent=p)
    # 口金
    cyl(_along(grip, dirv, 0.275), 0.030, 0.026, 0.045, gold, rot=(0, rot_y, rot_z), parent=p)
    # 刀身: 幅広の扁平な一枚刃 (boxのscaleは全長指定なので注意)
    box(_along(grip, dirv, 0.55), (0.13, 0.018, 0.54), steel, rot=(0, rot_y, rot_z), parent=p, bevel=0.02)
    box(_along(grip, dirv, 0.70), (0.16, 0.017, 0.28), steel, rot=(0, rot_y, rot_z), parent=p, bevel=0.024)
    # 切っ先 (上に反り上がる・本体に食い込ませる)
    box(_along(grip, dirv, 0.85), (0.095, 0.015, 0.15), steel,
        rot=(0, rot_y - 22, rot_z), parent=p, bevel=0.02)
    # 峰の背金ライン
    c1, c2 = _along(grip, dirv, 0.38), _along(grip, dirv, 0.78)
    seg((c1[0] - 0.040, c1[1], c1[2]), (c2[0] - 0.062, c2[1], c2[2]), 0.0075, 0.0055, gold, parent=p)
    # 柄尻リング+小さめの赤房
    ring = _along(grip, dirv, -0.135)
    torus(ring, 0.024, 0.0055, gold, rot=(90, rot_y, rot_z), parent=p)
    cyl((ring[0], ring[1], ring[2] - 0.048), 0.011, 0.019, 0.06, red, parent=p)


def weapon_chasen_staff(p, grip):
    """茶筅型の杖: 縦に地面へ突く"""
    wood = mat("staff", PAL["wood"], 0, 0.6)
    wlt = mat("chasen", PAL["wood_lt"], 0, 0.6)
    gold = mat("gold", PAL["gold"], 0.7, 0.3)
    x, y = grip[0] + 0.03, grip[1]
    top_z = grip[2] + 0.40
    cyl((x, y, top_z / 2), 0.019, 0.023, top_z, wood, parent=p)
    torus((x, y, grip[2] + 0.085), 0.026, 0.006, gold, scale=(1, 1, 0.7), parent=p)
    sph((x, y, top_z + 0.035), 0.040, wlt, scale=(1, 1, 0.85), parent=p)
    for k in range(10):
        a = D(k * 36.0)
        ox, oy = math.cos(a), math.sin(a)
        seg((x + ox * 0.020, y + oy * 0.020, top_z + 0.06),
            (x + ox * 0.055, y + oy * 0.055, top_z + 0.185), 0.0048, 0.0030, wlt, parent=p)
    torus((x, y, top_z + 0.062), 0.032, 0.0065, mat("himo", PAL["dgreen_dk"], 0, 0.7), parent=p)


# ============================================================
# 刺繍 (カメラ側 -Y の裾パネルに乗せる)
# ============================================================

def dragon_embroidery(p, sh_w, hem_z, hip_z):
    """金龍刺繍: 裾を蛇行して登る金ライン+龍頭"""
    gold = mat("emb", PAL["gold"], 0.55, 0.4)
    pts = []
    n = 12
    z0, z1 = hem_z + 0.05, hip_z + 0.16
    for k in range(n):
        t = k / (n - 1)
        z = z0 + t * (z1 - z0)
        x = 0.02 + 0.085 * math.sin(t * math.pi * 2.2)
        y = -sh_w * (0.93 - 0.16 * t)
        pts.append((x, y, z))
    tube(pts, 0.0105, gold, parent=p)
    hx, hy, hz = pts[-1]
    sph((hx + 0.02, hy, hz + 0.03), 0.030, gold, scale=(1.5, 0.6, 0.85), rot=(0, -25, 0), parent=p)
    for sy in (1, -1):
        cyl((hx, hy + sy * 0.016, hz + 0.065), 0.006, 0.0015, 0.05, gold, rot=(sy * 16, -22, 0), parent=p)
    tx, ty, tz = pts[0]
    torus((tx, ty, tz + 0.012), 0.026, 0.0075, gold, rot=(90, 0, 20), parent=p)


def wave_embroidery(p, sh_w, hem_z, hip_z):
    """和柄(青海波風): 裾の金の半円弧列 + 上昇する金渦"""
    gold = mat("emb", PAL["gold"], 0.55, 0.4)
    for k in range(3):
        x = -0.12 + k * 0.105
        yb = -sh_w * 0.90 * math.sqrt(max(0.15, 1 - (x / (sh_w * 0.95)) ** 2))
        torus((x, yb, hem_z + 0.07), 0.038, 0.008, gold, rot=(82, 0, -x * 50), parent=p)
        torus((x + 0.045, yb, hem_z + 0.042), 0.024, 0.0065, gold, rot=(82, 0, -x * 50), parent=p)
    pts = []
    n = 9
    for k in range(n):
        t = k / (n - 1)
        z = hem_z + 0.13 + t * (hip_z - hem_z)
        x = 0.01 + 0.07 * math.sin(t * math.pi * 1.7)
        pts.append((x, -sh_w * (0.90 - 0.14 * t), z))
    tube(pts, 0.009, gold, parent=p)


def gold_swirl_embroidery(p, sh_w, hem_z, hip_z):
    """金の唐草風"""
    gold = mat("emb", PAL["emb"] if "emb" in PAL else PAL["gold"], 0.55, 0.4)
    pts = []
    n = 10
    for k in range(n):
        t = k / (n - 1)
        z = hem_z + 0.05 + t * (hip_z - hem_z + 0.10)
        x = 0.02 + 0.075 * math.sin(t * math.pi * 1.9 + 0.5)
        pts.append((x, -sh_w * (0.92 - 0.15 * t), z))
    tube(pts, 0.0095, gold, parent=p)
    torus((pts[-1][0], pts[-1][1], pts[-1][2] + 0.03), 0.024, 0.008, gold, rot=(90, 0, 0), parent=p)


# ============================================================
# キャラ組み立て
# ============================================================

def build_character(cfg):
    p = root()
    H = cfg["H"]
    bulk = cfg["bulk"]
    head_r = H * 0.084
    cz_target = H - head_r * 1.05          # 頭頂(髪除く)がほぼ H
    sh_z = cz_target - head_r * 1.58
    # 息継ぎ/力み: 肩・頭・腕の持ち上がり量
    sh_z += {"idle": 0.0, "idle2": 0.010, "idle3": 0.020, "atk": 0.012, "hit": 0.0, "grd": 0.006}[POSE]
    sh_w = H * 0.118 * cfg.get("sh", 1.0)
    hip_z = H * 0.515
    knee_z = H * 0.285
    bontan(p, cfg, hip_z, knee_z, bulk)
    if cfg.get("shirtless"):
        bare_torso(p, cfg, hip_z, sh_z, sh_w, bulk)
    else:
        tokkofuku(p, cfg, hip_z, sh_z, sh_w, bulk)
    head(p, cfg, sh_z, head_r)
    wp = cfg.get("weapon")
    if wp == "chasen":
        pose_cam, pose_far = "grip", "down"
    elif wp in ("bat_gold", "bokuto", "guandao"):
        pose_cam, pose_far = {
            "idle": ("shoulder", "down"), "idle2": ("shoulder", "down"), "idle3": ("shoulder", "down"),
            "atk": ("swing", "back"), "hit": ("shoulder", "flail"), "grd": ("hold", "down"),
        }[POSE]
    else:
        pose_cam, pose_far = "down", "down"
    grip = arm(p, cfg, -1, sh_z, sh_w, bulk, pose_cam)   # カメラ側(-Y)=武器側
    arm(p, cfg, 1, sh_z, sh_w, bulk, pose_far)
    if wp == "bat_gold":
        weapon_bat_gold(p, grip)
    elif wp == "bokuto":
        weapon_bokuto(p, grip)
    elif wp == "guandao":
        weapon_guandao(p, grip)
    elif wp == "chasen":
        weapon_chasen_staff(p, grip)
    hem_z = cfg.get("hem_z", 0.46)
    emb = cfg.get("embroidery")
    if emb == "dragon":
        dragon_embroidery(p, sh_w, hem_z, hip_z)
    elif emb == "wave":
        wave_embroidery(p, sh_w, hem_z, hip_z)
    elif emb == "swirl":
        gold_swirl_embroidery(p, sh_w, hem_z, hip_z)
    # 体全体のリーン (足元支点。atk=前傾 / hit=のけぞり / grd=半身)
    lean = {"idle": 0, "idle2": 0, "idle3": 0, "atk": 9, "hit": -8, "grd": -3}[POSE]
    p.rotation_euler = (0, D(lean), 0)
    # リーンで画面外に出ないよう全体を引き戻す
    p.location.x = {"atk": -0.13, "hit": 0.05}.get(POSE, 0.0)
    return p


# ============================================================
# シーン/レンダ
# ============================================================

def setup_scene():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = 560
    scene.render.resolution_y = 1000
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # Freestyle 輪郭線 (アニメ調)
    scene.render.use_freestyle = True
    scene.render.line_thickness = 1.0
    vl = bpy.context.view_layer
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = D(95)
    ls = fs.linesets.new("outline")
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = True
    ls.select_external_contour = True
    style = ls.linestyle
    style.color = (0.03, 0.02, 0.04)
    style.thickness = 2.1
    # カメラ: 右向き3/4・水平・ortho。下端=z0 (足裏接地)
    az = D(32)
    R = 8.0
    oscale, zc = (2.30, 2.30 / 2.0) if ZOOM is None else (ZOOM[0], ZOOM[1])
    bpy.ops.object.camera_add(location=(R * math.sin(az), -R * math.cos(az), zc))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.pi / 2, 0, az)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = oscale
    scene.camera = cam
    # ライティング: キー強め+フィル弱+環境 (アニメ調のフラットさとメリハリ)
    bpy.ops.object.light_add(type="SUN", location=(4, -5, 6))
    key = bpy.context.active_object
    key.data.energy = 4.0
    key.rotation_euler = (D(58), 0, D(18))
    bpy.ops.object.light_add(type="AREA", location=(2.5, 3.5, 2.0))
    fill = bpy.context.active_object
    fill.data.energy = 150
    fill.data.size = 5
    fill.rotation_euler = (D(72), 0, D(145))
    world = bpy.data.worlds.new("w") if scene.world is None else scene.world
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (1, 1, 1, 1)
    bg.inputs["Strength"].default_value = 0.42
    # (左右反転はレンダ後に flip_image_x() で行う。Blender5 は scene.node_tree 廃止のため)


# ============================================================
# キャラ定義
# ============================================================

CHARS = {
    # ラスボス 総長アンジョー: 白特攻服・金龍刺繍・長身・金バット・銀白髪
    "shin-anjo": {
        "H": 1.88, "bulk": 1.12, "sh": 1.14,
        "coat": PAL["white"], "coat_dk": PAL["offwhite"],
        "pants": PAL["white"], "pants_dk": PAL["offwhite"],
        "hair": PAL["hair_sil"], "brow": C(0.36, 0.38, 0.44), "inner": PAL["black"],
        "weapon": "bat_gold", "embroidery": "dragon",
        "hem_z": 0.44, "pompadour": 1.3,
        "out": ("boss", "shin-anjo.png"),
    },
    # 中ボス 吉良の若殿マサキ: 紫・金刺繍・ヤセ長身・豪華木刀・頬傷
    "kira-yoshida": {
        "H": 1.84, "bulk": 0.88, "sh": 0.98,
        "coat": PAL["purple"], "coat_dk": PAL["purple_dk"],
        "pants": PAL["purple_dk"], "pants_dk": PAL["black"],
        "hair": PAL["hair_blk"], "inner": PAL["black"],
        "weapon": "bokuto", "embroidery": "swirl",
        "hem_z": 0.46, "pompadour": 1.05, "scar": True,
        "out": ("boss", "kira-yoshida.png"),
    },
    # 中ボス 西尾: スキンヘッド+上半身裸入れ墨+サングラス+青龍刀 (hoshiさん指定 2026-06-12)
    #          駅カラーの深緑はボンタンに反映
    "nishio": {
        "H": 1.80, "bulk": 1.15, "sh": 1.12,
        "coat": PAL["dgreen"], "coat_dk": PAL["dgreen_dk"],
        "pants": PAL["dgreen"], "pants_dk": PAL["dgreen_dk"],
        "hair": PAL["hair_blk"], "brow": PAL["hair_blk"],
        "weapon": "guandao", "skinhead": True, "shirtless": True, "sunglasses": True,
        "face_scar_x": True,
        "out": ("boss", "nishio.png"),
    },
    # アーキタイプ17体目: スキンヘッドの殺し屋 (上半身裸・入れ墨・サングラス・青龍刀)
    "skinhead": {
        "H": 1.82, "bulk": 1.18, "sh": 1.15,
        "coat": PAL["coal"], "coat_dk": PAL["black"],
        "pants": PAL["black"], "pants_dk": PAL["coal"],
        "hair": PAL["hair_blk"], "brow": PAL["hair_blk"],
        "weapon": "guandao", "skinhead": True, "shirtless": True, "sunglasses": True,
        "face_scar_x": True,
        "out": (None, "skinhead.png"),
    },
}


def render_one(cid):
    clear()
    setup_scene()
    cfg = CHARS[cid]
    build_character(cfg)
    sub, fn = cfg.get("out", ("boss", cid + ".png"))
    fn = fn[:-4] + POSE_SUFFIX[POSE] + ".png"
    out = OUT_OVERRIDE or os.path.join(BOSS_DIR if sub == "boss" else CHAR_DIR, fn)
    # 向きは右向きで出力 (a111d30 で確定。カメラ既定の向きのまま反転しない)
    bpy.context.scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("WROTE", out)


targets = list(CHARS.keys()) if ALL else [ONLY or "shin-anjo"]
poses = POSES_ALL if ALL else (POSE,)
for cid in targets:
    for POSE in poses:
        render_one(cid)
