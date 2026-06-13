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
    "skin":      C(0.95, 0.76, 0.59),
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


def face_player(p, cz, r, cfg):
    """主人公専用の顔: 切れ長のはっきりした目+キャッチライト・直線キリ眉・通った鼻筋・不敵な片笑み"""
    skin = mat("skin", PAL["skin"])
    skin_dk = mat("skin_dk", C(0.78, 0.56, 0.42), 0, 0.85)
    # シャープな輪郭 (顎は細めのV字・エラ張りなし)
    sph((r * 0.16, 0, cz - r * 0.52), r * 0.78, skin, scale=(0.92, 0.80, 0.78), parent=p)
    sph((r * 0.74, 0, cz - r * 0.90), r * 0.20, skin, scale=(0.85, 0.70, 0.62), parent=p)
    for sy in (1, -1):
        sph((r * 0.40, sy * r * 0.54, cz - r * 0.02), r * 0.24, skin, parent=p)
    # 通った鼻筋 (丸断面の隆起: 角柱だと横から灰色の板に見える)
    sph((r * 0.93, 0, cz - r * 0.05), r * 0.09, skin, scale=(0.55, 0.52, 1.65), rot=(0, 13, 0), parent=p)
    sph((r * 1.00, 0, cz - r * 0.23), r * 0.10, skin, scale=(0.78, 0.60, 0.78), parent=p)
    # 目: 大きめ切れ長・濃茶虹彩+黒瞳+白キャッチライト (虚ろ解消の要)
    ew = mat("eye_w_p", C(0.98, 0.98, 0.96), 0, 0.3)
    iris = mat("iris_p", C(0.32, 0.17, 0.08), 0, 0.25)
    pupil = mat("pupil_p", C(0.05, 0.04, 0.04), 0, 0.25)
    hl = mat("hl_p", C(1.0, 1.0, 1.0), 0, 0.2)
    lash = mat("lash_p", C(0.06, 0.06, 0.09), 0, 0.6)
    for sy in (1, -1):
        near = (sy == -1)                      # 両目ともカメラへ向ける (3/4顔の描き目)。奥目は小さめ
        th = D(17 if near else 20)
        ex, ey = r * math.cos(th) * 0.90, sy * r * math.sin(th) * (1.30 if near else 1.32)
        ez = cz + r * 0.10
        rz = sy * 12 - (34 if near else 26)
        oy = -r * 0.045 if near else -r * 0.030
        esc = 1.0 if near else 0.82            # 奥目は遠近で少し小さく
        sph((ex, ey, ez), r * 0.29 * esc, ew, scale=(0.36, 1.05, 0.74), rot=(sy * -8, 0, rz), parent=p)
        sph((ex + r * 0.065, ey + oy, ez), r * 0.165 * esc, iris, scale=(0.40, 0.85, 1.0), rot=(0, 0, rz), parent=p)
        sph((ex + r * 0.10, ey + oy * 1.4, ez), r * 0.075 * esc, pupil, scale=(0.40, 0.80, 1.0), rot=(0, 0, rz), parent=p)
        sph((ex + r * 0.115, ey + oy * 1.5, ez + r * 0.075), r * 0.042 * esc, hl, parent=p)
        # 上まつげライン (目尻はね上げ)
        box((ex + r * 0.04, ey + sy * r * 0.01, ez + r * 0.155), (r * 0.075, r * 0.30, r * 0.05),
            lash, rot=(sy * -14, 2, rz - sy * 2), parent=p, bevel=0.005)
        # 直線のキリ眉 (太め・わずかに吊り上げ)
        box((ex + r * 0.035, ey + sy * r * 0.02, ez + r * 0.33), (r * 0.13, r * 0.40, r * 0.105),
            mat("brow_p", C(0.05, 0.05, 0.08), 0, 0.7), rot=(sy * -14, 4, rz - sy * 3), parent=p, bevel=0.010)
    # 口: 不敵な片笑み (カメラ側の口角を上げる)
    mz = cz - r * 0.62
    box((r * 0.78, -r * 0.06, mz), (r * 0.05, r * 0.40, r * 0.062),
        mat("mouth_p", C(0.34, 0.14, 0.12), 0, 0.5), rot=(-16, 8, -6), parent=p, bevel=0.006)
    sph((r * 0.70, -r * 0.305, mz + r * 0.085), r * 0.05, skin_dk, scale=(0.5, 0.6, 0.5), parent=p)
    # 耳
    for sy in (1, -1):
        sph((-r * 0.06, sy * r * 0.94, cz - r * 0.10), r * 0.23, skin, scale=(0.55, 0.35, 0.82), parent=p)


def face(p, cz, r, cfg):
    """顔: 三白眼の睨み・極太の八の字眉・眉間の皺・への字大口+食いしばり・エラ顎・青髭・傷"""
    if cfg.get("face_style") == "player":
        return face_player(p, cz, r, cfg)
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
        box((r * 0.20, sy * r * 0.82, cz - r * 0.24), (r * 0.08, r * 0.04, r * 0.22), h,
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
    ankle = 0.052 * max(1.0, bulk * 0.9)
    stance = 0.105 * bulk    # 体格に応じて足幅も広げる
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
        pts.append((rr * 0.74 * math.cos(a), rr * math.sin(a), z))
    tube(pts, 0.019, tat, parent=p)
    # 二重コイル (腹に巻く下段)
    pts2 = []
    for k in range(10):
        t = k / 9.0
        z = hip_z + 0.04 + t * 0.10
        a = D(40 - 150 * t)
        rr = sh_w * 0.70
        pts2.append((rr * 0.74 * math.cos(a), rr * math.sin(a), z))
    tube(pts2, 0.015, tat, parent=p)
    # 龍頭 (カメラ側の鎖骨上・皮膚に沿わせて平たく) + 角 + 紅の目
    hx, hy, hz = sh_w * 0.28, -sh_w * 0.62, sh_z + 0.02
    sph((hx, hy, hz), 0.052, tat, scale=(1.3, 0.38, 0.80), rot=(0, -18, -35), parent=p)
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
    # 胴 (逆三角)。前面サーフェス基準の半径を先に計算しておく
    top_r = sh_w * 0.86 * 0.76          # 胸上部の前後半径
    waist_r = sh_w * 0.60 * bulk * 0.76  # 腰の前後半径
    cyl((0, 0, (hip_z + sh_z) / 2 + 0.02), sh_w * 0.60 * bulk, sh_w * 0.86, (sh_z - hip_z) + 0.10,
        skin, scale=(0.76, 1, 1), parent=p)
    # 大胸筋: 瘤にならないよう薄い面で (大部分を胴に沈める)
    for sy in (1, -1):
        sph((top_r * 0.62, sy * sh_w * 0.38, sh_z - 0.115), sh_w * 0.34, skin, scale=(0.42, 0.90, 0.60), parent=p)
    # 僧帽筋
    sph((-sh_w * 0.24, 0, sh_z - 0.05), sh_w * 0.48, skin, scale=(0.60, 1.00, 0.60), parent=p)
    # 筋肉の定義は「線」で描く (アニメ調・瘤防止)
    #   胸下ライン
    for sy in (1, -1):
        box((top_r * 0.92, sy * sh_w * 0.30, sh_z - 0.205), (0.012, sh_w * 0.40, 0.013), skin_dk,
            rot=(sy * 8, 0, sy * -6), parent=p, bevel=0.004)
    #   腹の正中線 + 横ライン2本 (シックスパックを線で)
    box((waist_r * 0.985, 0.0, hip_z + 0.155), (0.012, 0.013, 0.155), skin_dk, parent=p, bevel=0.004)
    for row in range(2):
        az = hip_z + 0.115 + row * 0.085
        box((waist_r * 0.975, 0, az), (0.012, sh_w * 0.30, 0.013), skin_dk, parent=p, bevel=0.004)
    # 腹斜筋の影ライン
    for sy in (1, -1):
        box((waist_r * 0.72, sy * sh_w * 0.36, hip_z + 0.16), (0.012, 0.012, 0.10), skin_dk,
            rot=(sy * 12, 0, 0), parent=p, bevel=0.004)
    # ベルト+バックル (ボンタンの腰)
    cyl((0, 0, hip_z + 0.015), sh_w * 0.62 * bulk, sh_w * 0.60 * bulk, 0.055,
        mat("belt", PAL["black"], 0.1, 0.5), scale=(0.80, 1, 1), parent=p)
    sph((sh_w * 0.62 * bulk * 0.80, 0, hip_z + 0.015), 0.026, mat("buckle", PAL["gold"], 0.7, 0.3),
        scale=(0.5, 1.1, 1.0), parent=p)
    body_tattoo(p, sh_w, sh_z, hip_z)


def tokkofuku(p, cfg, hip_z, sh_z, sh_w, bulk):
    """特攻服/長ラン: 胴+ロングスカート+詰襟+金ボタン"""
    cc = mat("coat", cfg["coat"], 0, 0.9)
    cd = mat("coat_dk", cfg["coat_dk"], 0, 0.9)
    gold = mat("gold", PAL["gold"], 0.7, 0.35)
    inner = mat("inner", cfg.get("inner", PAL["black"]), 0, 0.8)
    hem_z = cfg.get("hem_z", 0.46)
    # 胴 (逆三角: 肩広く腰すぼむ)。前面サーフェス基準の半径を先に計算
    top_r = sh_w * 0.88 * 0.76           # 胸上部の前後半径
    waist_r = sh_w * 0.66 * bulk * 0.76  # 腰の前後半径
    hem_r = sh_w * 0.70 * bulk * 0.80    # 裾の前後半径
    cyl((0, 0, (hip_z + sh_z) / 2 + 0.02), sh_w * 0.66 * bulk, sh_w * 0.88, (sh_z - hip_z) + 0.10,
        cc, scale=(0.76, 1, 1), parent=p)
    # 大胸筋 (服の上からの厚みなので薄く・沈める)
    for sy in (1, -1):
        sph((top_r * 0.60, sy * sh_w * 0.36, sh_z - 0.10), sh_w * 0.30, cc, scale=(0.40, 0.88, 0.60), parent=p)
    # 背中(僧帽筋)
    sph((-sh_w * 0.26, 0, sh_z - 0.06), sh_w * 0.50, cc, scale=(0.60, 1.00, 0.60), parent=p)
    # ロング裾 (膝まで・下に向かってフレア)
    cyl((0, 0, (hip_z + hem_z) / 2 + 0.02), sh_w * 0.70 * bulk, sh_w * 0.64 * bulk, (hip_z - hem_z) + 0.08,
        cc, scale=(0.80, 1, 1), parent=p)
    # 裾の折り返し
    torus((0, 0, hem_z + 0.01), sh_w * 0.68 * bulk, 0.013, cd, scale=(0.80, 1, 0.75), parent=p)
    # 前合わせ縦ライン (胸/裾で面に沿わせて分割)
    box(((top_r + waist_r) / 2 + 0.006, 0.012, (hip_z + sh_z) / 2), (0.013, 0.011, (sh_z - hip_z) * 0.46),
        cd, rot=(0, -6, 0), parent=p, bevel=0.004)
    box(((waist_r + hem_r) / 2 + 0.006, 0.012, (hip_z + hem_z) / 2), (0.013, 0.011, (hip_z - hem_z) * 0.46),
        cd, rot=(0, 7, 0), parent=p, bevel=0.004)
    if cfg.get("sarashi"):
        # 前開き: 白さらしの帯パネル + 巻き線 (ボタンは省略)
        sar = mat("sarashi", C(0.93, 0.92, 0.89), 0, 0.85)
        sar_d = mat("sarashi_d", C(0.78, 0.77, 0.74), 0, 0.85)
        # 胴に沿う白さらし (太い帯を体に食い込ませる) + 巻き線 + 前開きの襟边
        cyl((0, 0, (sh_z + hip_z) / 2 - 0.02), sh_w * 0.70 * bulk, sh_w * 0.84, (sh_z - hip_z) * 0.66,
            sar, scale=(0.86, 0.90, 1), parent=p)
        for k in range(2):
            torus((0, 0, hip_z + 0.12 + k * 0.13), sh_w * 0.715 * bulk, 0.0045, sar_d,
                  scale=(0.853, 0.892, 0.7), parent=p)
        for sy in (1, -1):  # 学ランの前端 (さらしの両脇の濃い縁)
            box((top_r * 0.90, sy * sh_w * 0.34, (sh_z + hip_z) / 2), (0.030, 0.035, (sh_z - hip_z) * 0.50),
                cd, rot=(0, -5, sy * 3), parent=p, bevel=0.008)
        for k in range(4):  # 前端の金ボタン (カメラ側)
            sph((top_r * 0.93, -sh_w * 0.345, sh_z - 0.10 - k * 0.105), 0.016, gold, parent=p)
    else:
        # 金ボタン5個 (胸の面に沿って)
        for k in range(5):
            t = k / 4.0
            bz = sh_z - 0.07 - t * (sh_z - hip_z - 0.02)
            fr = top_r * (1 - t) + waist_r * t + 0.012
            sph((fr, 0.030, bz), 0.0155, gold, parent=p)
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
    sph(sh_pos, sh_w * 0.28 * bulk, cc, scale=(0.95, 0.82, 0.95), parent=p)  # 三角筋
    if pose == "shoulder":
        # 上腕は体側に沿わせて下ろし、前腕を前上45度に曲げて担ぐ (肘の折れが自然に見える)
        elbow = (0.030, y0 * 1.10, sh_z - 0.305)
        f = (0.205, y0 * 0.96, sh_z - 0.045)
        seg(sh_pos, elbow, 0.075 * bulk, 0.060 * bulk, cc, parent=p)
        sph(elbow, 0.050 * bulk, cc, parent=p)
        seg(elbow, (f[0] - 0.012, f[1], f[2] - 0.012), 0.058 * bulk, 0.048, cc, parent=p)
        ring((f[0] - 0.062, f[1] + sy * 0.01, f[2] - 0.062), 0.050, 0.008, gold, rot=(0, 42, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "swing":
        # 振り下ろし: 腕を前へ伸ばし切る
        elbow = (0.16, y0 * 1.02, sh_z - 0.155)
        f = (0.355, y0 * 0.82, sh_z - 0.065)
        seg(sh_pos, elbow, 0.075 * bulk, 0.060 * bulk, cc, parent=p)
        sph(elbow, 0.050 * bulk, cc, parent=p)
        seg(elbow, (f[0] - 0.015, f[1], f[2]), 0.058 * bulk, 0.048, cc, parent=p)
        ring((f[0] - 0.075, f[1], f[2] - 0.035), 0.050, 0.008, gold, rot=(0, 65, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "back":
        # 攻撃の反対腕: 後ろへ振る
        elbow = (-0.085, y0 * 1.16, sh_z - 0.255)
        f = (-0.155, y0 * 1.18, sh_z - 0.510)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.048 * bulk, cc, parent=p)
        seg(elbow, (f[0], f[1], f[2] + 0.025), 0.054 * bulk, 0.045, cc, parent=p)
        ring((f[0] + 0.01, f[1], f[2] + 0.08), 0.048, 0.008, gold, rot=(0, -14, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "flail":
        # 被弾: 腕が跳ね上がる
        elbow = (0.045, y0 * 1.18, sh_z - 0.235)
        f = (0.145, y0 * 1.20, sh_z + 0.020)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.048 * bulk, cc, parent=p)
        seg(elbow, (f[0] - 0.01, f[1], f[2] - 0.02), 0.054 * bulk, 0.045, cc, parent=p)
        ring((f[0] - 0.03, f[1], f[2] - 0.075), 0.048, 0.008, gold, rot=(0, 20, 0), parent=p)
        fist(p, f)
        return f
    elif pose == "hold":
        # ガード: 体の前で武器を縦に握る
        elbow = (0.105, y0 * 1.05, sh_z - 0.275)
        f = (0.275, y0 * 0.60, sh_z - 0.185)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.048 * bulk, cc, parent=p)
        seg(elbow, f, 0.055 * bulk, 0.046, cc, parent=p)
        ring((f[0] - 0.05, f[1] + sy * 0.018, f[2] + 0.012), 0.048, 0.008, gold,
             rot=(0, 75, sy * -16), parent=p)
        fist(p, f)
        return f
    elif pose == "grip":
        elbow = (0.10, y0 * 1.06, sh_z - 0.27)
        f = (0.27, y0 * 0.66, sh_z - 0.30)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.048 * bulk, cc, parent=p)
        seg(elbow, f, 0.055 * bulk, 0.046, cc, parent=p)
        ring((f[0] - 0.045, f[1] + sy * 0.02, f[2] + 0.012), 0.048, 0.008, gold,
              rot=(0, 78, sy * -18), parent=p)
        fist(p, f)
        return f
    else:  # down
        elbow = (0.015, y0 * 1.22, sh_z - 0.30)
        f = (0.040, y0 * 1.24, sh_z - 0.585)
        seg(sh_pos, elbow, 0.072 * bulk, 0.058 * bulk, cc, parent=p)
        sph(elbow, 0.048 * bulk, cc, parent=p)
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

def build_rider(p, cfg):
    """暴走族ライダー: 旧車會単車(絞りハンドル・三段シート・ロケットカウル・竹やりマフラー)
    + 跨がった不良。POSE idle2 はエンジン振動で車体+ライダーがわずかに上下"""
    vib = 0.010 if POSE == "idle2" else 0.0
    tire = mat("tire", C(0.09, 0.09, 0.10), 0, 0.85)
    chrome = mat("chrome", C(0.80, 0.83, 0.88), 0.9, 0.18)
    steel_dk = mat("steel_dk", C(0.22, 0.23, 0.27), 0.6, 0.4)
    # 採用見本 (Slack F0BA7S82H60): 青ボディ+白タンク赤ライン+白三段シート+クローム集合管
    body_c = mat("bike_body", cfg.get("bike", C(0.12, 0.22, 0.58)), 0.15, 0.5)
    seat_w = mat("seat_w", C(0.92, 0.91, 0.88), 0, 0.8)
    accent_r = mat("accent_r", C(0.75, 0.12, 0.12), 0.1, 0.5)
    gold = mat("gold", PAL["gold"], 0.7, 0.35)
    # ---- 車輪 (接地・振動しない) ----
    wr = 0.30
    for wx in (0.88, -0.78):
        torus((wx, 0, wr), wr * 0.76, wr * 0.26, tire, rot=(90, 0, 0), parent=p)
        cyl((wx, 0, wr), wr * 0.55, wr * 0.55, 0.05, steel_dk, rot=(90, 0, 0), parent=p)
        cyl((wx, 0, wr), 0.05, 0.05, 0.10, chrome, rot=(90, 0, 0), parent=p)
    # ---- 車体 (以下 vib 分上下) ----
    v = vib
    head_tube = (0.62, 0, 0.80 + v)
    # フロントフォーク
    for sy in (1, -1):
        seg(head_tube, (0.88, sy * 0.05, wr + 0.02 + v), 0.022, 0.018, chrome, parent=p)
    # メインフレーム+エンジン
    seg((-0.70, 0, 0.46 + v), head_tube, 0.035, 0.030, body_c, parent=p)
    seg((-0.70, 0, 0.46 + v), (-0.05, 0, 0.38 + v), 0.030, 0.030, steel_dk, parent=p)
    box((0.08, 0, 0.46 + v), (0.34, 0.24, 0.26), steel_dk, parent=p, bevel=0.02)   # エンジンブロック
    for k in range(3):  # 冷却フィン
        box((0.10, 0, 0.40 + 0.05 * k + v), (0.38, 0.27, 0.018), chrome, parent=p, bevel=0.004)
    cyl((0.13, 0, 0.36 + v), 0.085, 0.085, 0.30, chrome, rot=(90, 0, 0), parent=p)  # クランクケース
    # タンク (白ベース+赤ライン+青ライン: 見本のトリコロール)
    sph((0.33, 0, 0.74 + v), 0.20, mat("tank_w", C(0.90, 0.90, 0.88), 0.1, 0.5),
        scale=(1.15, 0.62, 0.52), parent=p)
    box((0.33, -0.125, 0.745 + v), (0.40, 0.012, 0.035), accent_r, rot=(0, -4, 0), parent=p, bevel=0.004)
    box((0.33, -0.126, 0.705 + v), (0.40, 0.012, 0.022), body_c, rot=(0, -4, 0), parent=p, bevel=0.004)
    # 白の三段シート (タックロール風・赤パイピング・車体と一体) + シシーバー
    box((-0.28, 0, 0.62 + v), (0.40, 0.22, 0.10), seat_w, parent=p, bevel=0.02)
    for k in range(3):
        box((-0.47 - 0.05 * k, 0, 0.64 + 0.13 * k + v), (0.10, 0.20, 0.16), seat_w,
            rot=(0, -8, 0), parent=p, bevel=0.015)
        box((-0.505 - 0.05 * k, -0.101, 0.64 + 0.13 * k + v), (0.07, 0.006, 0.115), accent_r,
            rot=(0, -8, 0), parent=p, bevel=0.003)
    for sy in (1, -1):
        seg((-0.82, sy * 0.075, 0.42 + v), (-0.62, sy * 0.055, 1.08 + v), 0.016, 0.013, chrome, parent=p)
    seg((-0.62, 0.055, 1.08 + v), (-0.62, -0.055, 1.08 + v), 0.013, 0.013, chrome, parent=p)
    # 絞りハンドル (見本に合わせ中庸の高さ)
    for sy in (1, -1):
        seg((0.60, sy * 0.10, 0.84 + v), (0.46, sy * 0.085, 1.20 + v), 0.020, 0.018, chrome, parent=p)
        seg((0.46, sy * 0.085, 1.20 + v), (0.38, sy * 0.075, 1.24 + v), 0.018, 0.022, tire, parent=p)  # グリップ
    # ロケットカウル (青+赤ライン) + 丸目ヘッドライト
    cyl((0.86, 0, 0.86 + v), 0.16, 0.09, 0.34, body_c, rot=(0, 96, 0), parent=p)
    torus((0.84, 0, 0.875 + v), 0.145, 0.012, accent_r, rot=(0, 6, 0), scale=(1, 1, 0.85), parent=p)
    sph((1.03, 0, 0.83 + v), 0.085, chrome, scale=(0.45, 1, 1), parent=p)
    # クローム集合マフラー (低く後ろへ流して跳ね上げ・左右2本ずつ)
    for sy in (1, -1):
        for k in range(2):
            y = sy * (0.12 + 0.05 * k)
            seg((0.10, y, 0.30 + v), (-0.78, y * 1.1, 0.26 + v), 0.030, 0.030, chrome, parent=p)
            seg((-0.78, y * 1.1, 0.26 + v), (-1.16, y * 1.15, 0.46 + v), 0.032, 0.040, chrome, parent=p)
    if POSE == "idle2":  # 排気
        smoke = mat("smoke", C(0.62, 0.62, 0.64), 0, 1.0)
        sph((-1.28, -0.20, 0.50), 0.075, smoke, parent=p)
        sph((-1.40, -0.19, 0.60), 0.055, smoke, parent=p)
    # リアフェンダー+ナンバー
    box((-0.95, 0, 0.62 + v), (0.22, 0.18, 0.04), body_c, rot=(0, 24, 0), parent=p, bevel=0.01)
    box((-1.02, 0, 0.52 + v), (0.015, 0.16, 0.09), mat("plate", PAL["white"], 0, 0.7),
        rot=(0, 14, 0), parent=p, bevel=0.004)

    # ---- ライダー (跨がり・前傾でハンドルへ) ----
    r = 0.125                       # 頭半径
    hip = (-0.24, 0, 0.74 + v)
    sh_z = 1.32 + v
    sh_w = 0.235
    bulk = 1.1
    cc = mat("coat", cfg["coat"], 0, 0.9)
    pc = mat("pants", cfg["pants"], 0, 0.9)
    skin = mat("skin", PAL["skin"])
    shoe = mat("shoe", PAL["black"], 0.1, 0.4)
    # 脚: 跨がって膝を曲げステップへ
    for sy in (1, -1):
        knee = (0.10, sy * 0.20, 0.58 + v)
        foot = (-0.02, sy * 0.21, 0.30 + v)
        seg((hip[0], sy * 0.12, hip[2]), knee, 0.105, 0.085, pc, parent=p)
        sph(knee, 0.085, pc, parent=p)
        seg(knee, (foot[0], foot[1], foot[2] + 0.03), 0.080, 0.050, pc, parent=p)
        sph((foot[0] + 0.06, foot[1], foot[2]), 0.075, shoe, scale=(1.6, 0.6, 0.55), parent=p)
    # 胴 (前傾の学ラン/特攻服)
    cyl((hip[0] + 0.06, 0, (hip[2] + sh_z) / 2), sh_w * 0.62 * bulk, sh_w * 0.85, sh_z - hip[2] + 0.06,
        cc, scale=(0.74, 1, 1), rot=(0, 10, 0), parent=p)
    for sy in (1, -1):  # 肩
        sph((hip[0] + 0.12, sy * sh_w * 0.92, sh_z - 0.02), sh_w * 0.30 * bulk, cc, parent=p)
    # 金ボタン
    for k in range(4):
        sph((hip[0] + 0.20 + 0.012 * k, 0.028, sh_z - 0.10 - k * 0.115), 0.014, gold, parent=p)
    # 襟
    cyl((hip[0] + 0.13, 0, sh_z + 0.045), sh_w * 0.42, sh_w * 0.45, 0.08, cc, parent=p)
    # 腕: ハンドルグリップへ伸ばす
    for sy in (1, -1):
        grip_pos = (0.40, sy * 0.085, 1.26 + v)
        elbow = (0.08, sy * (sh_w + 0.06), 1.30 + v)
        seg((hip[0] + 0.12, sy * sh_w * 0.92, sh_z - 0.02), elbow, 0.068 * bulk, 0.058, cc, parent=p)
        sph(elbow, 0.060, cc, parent=p)
        seg(elbow, grip_pos, 0.054, 0.045, cc, parent=p)
        fist(p, grip_pos, r=0.046)
    # 赤帯 (見本の特攻服)
    cyl((hip[0] + 0.05, 0, hip[2] + 0.10), sh_w * 0.66, sh_w * 0.64, 0.06,
        mat("obi_r", C(0.72, 0.10, 0.10), 0, 0.7), scale=(0.74, 1, 1), rot=(0, 10, 0), parent=p)
    # 刺繍文字風 (背中の縦ダッシュ列)
    for k in range(3):
        box((hip[0] - 0.115, -0.065, sh_z - 0.16 - 0.085 * k), (0.012, 0.012, 0.055),
            mat("emb_k", C(0.12, 0.10, 0.10), 0, 0.7), rot=(0, 8, 0), parent=p, bevel=0.003)
    # 特攻服のロング裾 (シートの後ろへ垂らす)
    for sy in (1, -1):
        box((hip[0] - 0.16, sy * 0.10, hip[2] - 0.16), (0.16, 0.085, 0.30), cc,
            rot=(0, -18, sy * 6), parent=p, bevel=0.012)
    box((hip[0] - 0.26, 0, hip[2] - 0.20), (0.13, 0.16, 0.26), cc, rot=(0, -24, 0), parent=p, bevel=0.012)
    # 頭 (前傾・リーゼント+面構え)
    cz = sh_z + r * 1.45
    sph((hip[0] + 0.16, 0, cz), r, skin, scale=(0.95, 0.92, 1.04), parent=p)
    cyl((hip[0] + 0.15, 0, sh_z + r * 0.35), r * 0.46, r * 0.50, r * 1.0, skin, parent=p)
    hp = root(); hp.parent = p
    hp.location = (hip[0] + 0.16, 0, 0)
    face(hp, cz, r, cfg)
    pompadour(hp, cz, r, cfg)
    return p


# ============================================================
# チビ (2頭身・くにおくん風) — リアル寄り6頭身が不気味の谷に落ちるため、
# 振り切ったデフォルメで谷を回避する。全身を1体ごと個別造形 (共通素体なし)。
# ============================================================

def chibi_face(p, cz, r, cfg):
    """チビ顔: 大きいアニメ目+大キャッチライト・太い角眉・小さい鼻・不敵な片笑み。
    虚ろ回避=黒目を大きく+白いキャッチライトを必ず入れる。左右の瞳をわずかにずらす(死人感回避)"""
    skin = mat("cskin", PAL["skin"])
    skin_dk = mat("cskin_dk", C(0.82, 0.60, 0.45), 0, 0.85)
    ew = mat("ceye_w", C(0.98, 0.98, 0.97), 0, 0.3)           # 真っ白にしない (薄ピンクグレー)
    iris = mat("ciris", C(0.24, 0.13, 0.07), 0, 0.25)
    iris2 = mat("ciris2", C(0.45, 0.26, 0.13), 0, 0.3)
    pupil = mat("cpupil", C(0.04, 0.03, 0.04), 0, 0.25)
    hl = mat("chl", C(1.0, 1.0, 1.0), 0, 0.2)
    brow = mat("cbrow", cfg.get("brow", cfg["hair"]), 0, 0.7)
    stern = cfg.get("stern_eyes")               # 据わった目 (ボス用・睨み): 左右対称・小さい瞳孔・重い上瞼
    # 大きいアニメ目を顔の中央〜やや下に (チビ比率: 目は顔の下半分寄り・大きく)
    for sy in (1, -1):
        near = (sy == -1)                       # カメラ側(-Y)が手前=大きく
        th = D(19 if near else 22)
        ex = r * math.cos(th) * 0.93
        ey = sy * r * math.sin(th) * 1.16
        ez = cz - r * 0.03
        esc = 1.0 if near else (0.95 if stern else 0.85)   # 据わった目は左右差を縮め対称的に
        jitter = 0.0 if stern else (0, -0.01)[near]
        if stern:
            # 白目: 細く据わった切れ長 (縦を潰し横長に・境界シャープ)
            sph((ex, ey, ez), r * 0.42 * esc, ew, scale=(0.32, 1.02, 0.80), rot=(0, 0, sy * 4), parent=p)
            # 虹彩 (大きめ・濃い) → 据わった睨み
            sph((ex + r * 0.06, ey, ez - r * 0.02), r * 0.34 * esc, iris, scale=(0.36, 0.96, 0.84), parent=p)
            sph((ex + r * 0.075, ey, ez + r * 0.03), r * 0.20 * esc, iris2, scale=(0.36, 0.80, 0.58), parent=p)
            # 瞳孔: くっきり小さめ (但し眠く見えない程度の存在感)
            sph((ex + r * 0.10, ey, ez), r * 0.135 * esc, pupil, scale=(0.42, 0.94, 0.98), parent=p)
            # キャッチライト: 左右同位置に1点
            sph((ex + r * 0.15, ey - sy * r * 0.03, ez + r * 0.13), r * 0.058 * esc, hl, parent=p)
            # 上瞼ライン (被せ過ぎず=眠そう回避。睨みの陰だけ作る)
            box((ex + r * 0.06, ey, ez + r * 0.29), (r * 0.10, r * 0.40, r * 0.050),
                mat("clid", cfg.get("brow", C(0.05, 0.05, 0.08)), 0, 0.7), rot=(sy * -2, 5, sy * 6), parent=p, bevel=0.008)
            # 下まぶたライン (生気・据わり)
            box((ex + r * 0.02, ey, ez - r * 0.26), (r * 0.075, r * 0.36, r * 0.030),
                skin_dk, rot=(0, 0, sy * 3), parent=p, bevel=0.004)
            # 極太・濃い眉を凶悪なハの字(内側下げ)に (威圧)
            box((ex + r * 0.05, ey, ez + r * 0.39), (r * 0.12, r * 0.44, r * 0.150),
                brow, rot=(sy * -7, 7, sy * -13), parent=p, bevel=0.012)
        else:
            sph((ex, ey, ez), r * 0.45 * esc, ew, scale=(0.32, 0.92, 1.12), rot=(0, 0, sy * 6), parent=p)
            sph((ex + r * 0.06, ey - sy * r * 0.02, ez - r * 0.01 + jitter * r), r * 0.33 * esc, iris,
                scale=(0.36, 0.94, 0.96), parent=p)
            sph((ex + r * 0.075, ey - sy * r * 0.02, ez + r * 0.06), r * 0.21 * esc, iris2,
                scale=(0.36, 0.82, 0.66), parent=p)
            sph((ex + r * 0.10, ey - sy * r * 0.02, ez + jitter * r), r * 0.145 * esc, pupil,
                scale=(0.36, 0.88, 0.96), parent=p)
            sph((ex + r * 0.15, ey - sy * r * 0.05, ez + r * 0.17), r * 0.085 * esc, hl, parent=p)
            # 上まぶた/まつげライン (目の上を締めて眠そう→不敵に)
            box((ex + r * 0.05, ey, ez + r * 0.31), (r * 0.085, r * 0.35, r * 0.05),
                mat("clash", C(0.05, 0.05, 0.08), 0, 0.6), rot=(sy * -3, 0, sy * 9), parent=p, bevel=0.005)
            # 下まつげ/涙袋の薄い影 (生気を足す)
            box((ex + r * 0.02, ey + sy * r * 0.01, ez - r * 0.32), (r * 0.07, r * 0.32, r * 0.03),
                skin_dk, rot=(0, 0, sy * 6), parent=p, bevel=0.004)
            # 太い角眉 (吊り上げ・不敵)
            box((ex + r * 0.05, ey + sy * r * 0.02, ez + r * 0.46), (r * 0.10, r * 0.36, r * 0.115),
                brow, rot=(sy * -8, 6, sy * -10), parent=p, bevel=0.012)
    # 小さい鼻 (点で十分)
    sph((r * 0.98, 0, cz - r * 0.18), r * 0.07, skin, scale=(0.6, 0.6, 0.7), parent=p)
    # 不敵な片笑み (カメラ側の口角だけ上げる)
    mz = cz - r * 0.54
    box((r * 0.87, -r * 0.05, mz), (r * 0.04, r * 0.34, r * 0.052),
        mat("cmouth", C(0.40, 0.16, 0.14), 0, 0.5), rot=(-15, 8, -7), parent=p, bevel=0.005)
    # 耳 (髪で大半隠れるので小さく)
    for sy in (1, -1):
        sph((-r * 0.02, sy * r * 0.92, cz - r * 0.06), r * 0.15, skin, scale=(0.5, 0.32, 0.7), parent=p)
    # 頬傷 (カメラ側・凶相用)
    if cfg.get("scar"):
        sc = mat("cscar", PAL["scar"], 0, 0.6)
        for k in range(3):
            box((r * 0.56, -r * 0.70, cz - r * (0.02 + 0.15 * k)), (r * 0.11, r * 0.030, r * 0.042),
                sc, rot=(0, -14, -10), parent=p, bevel=0.004)


def chibi_weapon_bat(p, grip, pose):
    """チビ用・金属バット (肩担ぎ idle / 前振り atk)。チビ寸法にスケール"""
    gold = mat("cbat", PAL["gold"], 0.85, 0.25)
    gdk = mat("cbat_dk", PAL["gold_dk"], 0.8, 0.35)
    if pose == "atk":
        dirv = (0.62, -0.05, -0.55)        # 前下振り
    elif pose == "grd":
        dirv = (0.05, 0.42, 0.91)          # 縦構え(カメラ奥へ)
    else:
        dirv = (0.02, -0.06, -1.0)         # idle: 地面に突き立てる(胸前を空け龍を見せる)
    n = math.sqrt(sum(x * x for x in dirv)); dirv = tuple(x / n for x in dirv)
    ry = math.degrees(math.atan2(math.hypot(dirv[0], dirv[1]), dirv[2]))
    rz = math.degrees(math.atan2(dirv[1], dirv[0]))
    along = lambda t: tuple(grip[k] + dirv[k] * t for k in range(3))
    L = 0.46
    cyl(along(L * 0.5 - 0.05), 0.028, 0.055, L, gold, rot=(0, ry, rz), parent=p)   # テーパー胴
    sph(along(L - 0.02), 0.058, gold, parent=p)                                    # 先端
    sph(along(-0.06), 0.032, gdk, scale=(1, 1, 0.6), rot=(0, ry, rz), parent=p)    # グリップエンド


def chibi_dragon_emb(p, sh_w, bulk, hem, hip_z):
    """チビ・金龍刺繍(hoshi指示③): 「龍」と一目で分かる形に。
    S字の胴+背鱗+爪付きの脚+はっきりした龍頭(長い鼻先/開いた顎/牙列/角/髭/赤眼)を
    白特攻服の前面に大きく配置し、赤帯とのコントラストで色の主役にする。"""
    g = mat("cemb", PAL["gold"], 0.85, 0.26)              # メタリック高め=艶やかに映える
    gb = mat("cemb_b", C(0.98, 0.84, 0.34), 0.75, 0.20)   # ハイライト金 (鱗/牙/角の輝き)
    surf = -sh_w * bulk * 0.90          # カメラ側コートの表面付近 (前へ出す)
    # ---- 胴: 下腹〜胸へ大きくS字 ----
    pts = []
    n = 16
    ztop = hip_z + 0.30
    for k in range(n):
        t = k / (n - 1)
        z = hem + 0.04 + t * (ztop - hem)
        x = 0.02 + 0.17 * math.sin(t * math.pi * 2.0)      # 大きなうねり
        y = surf * (1.06 - 0.18 * t)
        pts.append((x, y, z))
    tube(pts, 0.032, g, parent=p)                          # 太い胴
    # 背鱗 (胴に沿って小さな金の山を並べる=龍らしさ)
    for k in range(2, n - 2):
        bx, by, bz = pts[k]
        sph((bx + 0.022, by - 0.02, bz), 0.020, gb, scale=(0.7, 0.6, 1.1), rot=(0, -20, 0), parent=p)
    # 脚 (爪付き・2本。龍と分かる決め手) -- 胴の下側と中ほどから
    for (lt, ldir) in ((0.30, 1), (0.55, -1)):
        li = int(lt * (n - 1)); lx, ly, lz = pts[li]
        kx, ky, kz = lx + ldir * 0.10, ly - 0.03, lz - 0.06     # 肘/膝
        cyl(((lx + kx) / 2, (ly + ky) / 2, (lz + kz) / 2), 0.014, 0.010, 0.12, g,
            rot=(0, 60, ldir * 40), parent=p)
        for c in (-1, 0, 1):                                    # 3本の爪
            cyl((kx + ldir * 0.03, ky - 0.015, kz - 0.05 + c * 0.018), 0.006, 0.0015, 0.05, gb,
                rot=(c * 16, 70, ldir * 30), parent=p)
    # ---- 龍頭 (胸上・大きく明確に) ----
    hx, hy, hz = pts[-1]
    sph((hx + 0.03, hy - 0.01, hz + 0.02), 0.070, g, scale=(1.5, 0.65, 1.05), rot=(0, -20, 0), parent=p)  # 頭部
    sph((hx + 0.13, hy - 0.02, hz - 0.01), 0.040, g, scale=(1.7, 0.6, 0.7), rot=(0, -34, 0), parent=p)    # 長い鼻先
    box((hx + 0.12, hy - 0.02, hz - 0.07), (0.060, 0.030, 0.018), gb, rot=(0, -28, 0), parent=p, bevel=0.006)  # 開いた下顎
    for c in (-1, 0, 1, 2):                                     # 牙列
        cyl((hx + 0.08 + c * 0.028, hy - 0.035, hz - 0.05), 0.005, 0.0012, 0.035, gb,
            rot=(0, -150, 0), parent=p)
    for sy in (1, -1):                                         # 角(後方へ) + 髭(前へ)
        cyl((hx - 0.01, hy + sy * 0.03, hz + 0.10), 0.010, 0.0022, 0.11, g, rot=(sy * 22, -18, 0), parent=p)
        cyl((hx + 0.10, hy + sy * 0.03, hz - 0.04), 0.004, 0.0010, 0.13, g, rot=(sy * 30, 20, sy * 24), parent=p)
        sph((hx - 0.05, hy + sy * 0.035, hz + 0.04), 0.018, gb, scale=(0.7, 0.6, 1.0), parent=p)  # たてがみ房
    sph((hx + 0.04, hy - 0.035, hz + 0.05), 0.014, mat("cemb_eye", C(0.88, 0.12, 0.10), 0, 0.35), parent=p)  # 赤眼
    # 火の玉/雲の渦 (龍を取り巻く・2つに抑えて龍を主役に)
    torus((0.04, surf * 0.98, hem + 0.12), 0.046, 0.011, g, rot=(80, -14, 18), parent=p)
    sph((hx + 0.20, hy - 0.02, hz + 0.06), 0.026, mat("cemb_fire", C(0.92, 0.30, 0.10), 0, 0.4),
        scale=(1.0, 0.7, 1.1), parent=p)                       # 口先の火の玉(赤橙=差し色)


def chibi_pompadour(p, cz, r, cfg):
    """チビ・リーゼント: 頭をすっぽり覆う土台 + 誇張した前ロール + もみあげ + ダックテール"""
    h = mat("chair", cfg["hair"], 0, 0.5)
    vol = cfg.get("pompadour", 1.25)
    # トップ〜後頭部の土台 (頭をすっぽり覆う)
    sph((-r * 0.06, 0, cz + r * 0.34), r * 1.04, h, scale=(1.04, 1.0, 0.98), parent=p)
    # 前ロール (高く前へ突き上げる巨大リーゼント。額は出して目を覆わない)
    sph((r * 0.50, 0, cz + r * 1.04), r * 0.60 * vol, h, scale=(1.5, 0.84, 0.78), rot=(0, -24, 0), parent=p)
    sph((r * (0.92 + 0.16 * vol), 0, cz + r * 0.94), r * 0.36 * vol, h,
        scale=(0.95, 0.66, 0.95), rot=(0, 16, 0), parent=p)
    # 生え際 (高い位置で前髪を眉の上に止める)
    box((r * 0.66, 0, cz + r * 0.74), (r * 0.12, r * 0.60, r * 0.10), h, rot=(0, -42, 0), parent=p, bevel=0.012)
    # もみあげ
    for sy in (1, -1):
        box((r * 0.32, sy * r * 0.82, cz - r * 0.18), (r * 0.06, r * 0.05, r * 0.24), h, parent=p, bevel=0.008)
    # 後ろのダックテール
    cyl((-r * 0.92, 0, cz + r * 0.02), r * 0.16, r * 0.03, r * 0.42, h, rot=(0, 118, 0), parent=p)


def build_chibi(cfg):
    """2頭身チビの組み立て。リアルパス(build_character)とは別系統で全身を造形する"""
    p = root()
    r = cfg.get("chead_r", 0.30)            # 頭が大きい (頭身を稼ぐ)
    sh_z = cfg.get("csh_z", 0.62)
    hip_z = cfg.get("chip_z", 0.32)
    sh_w = cfg.get("csh_w", 0.20)           # 肩幅は頭より狭く (チビ感)
    bulk = cfg.get("bulk", 1.0)
    sh_z += {"idle": 0.0, "idle2": 0.012, "idle3": 0.022, "atk": 0.010, "hit": 0.0, "grd": 0.006}.get(POSE, 0.0)
    cc = mat("ccoat", cfg["coat"], 0, 0.9)
    cd = mat("ccoat_dk", cfg["coat_dk"], 0, 0.9)
    pc = mat("cpants", cfg["pants"], 0, 0.9)
    pd = mat("cpants_dk", cfg["pants_dk"], 0, 0.9)
    gold = mat("cgold", PAL["gold"], 0.6, 0.35)
    skin = mat("cskin", PAL["skin"])
    shoe = mat("cshoe", PAL["black"], 0.1, 0.4)
    # ---- 脚 (短くずんぐりのボンタン) ----
    for sy in (1, -1):
        y = sy * 0.105
        cyl((0.0, y, (hip_z + 0.08) / 2 + 0.02), 0.140 * bulk, 0.110 * bulk, hip_z - 0.04, pc, parent=p)
        torus((0.0, y, 0.105), 0.105, 0.013, pd, scale=(1, 1, 0.6), parent=p)   # 裾の絞り
        sph((0.085, y, 0.05), 0.10, shoe, scale=(1.75, 0.7, 0.55), parent=p)    # 靴 (足裏≒z0)
    # ---- 胴 (学ラン: ずんぐり) ----
    cyl((0, 0, (hip_z + sh_z) / 2), sh_w * 1.05 * bulk, sh_w * 1.18, sh_z - hip_z + 0.06,
        cc, scale=(0.82, 1, 1), parent=p)
    for sy in (1, -1):
        sph((0, sy * sh_w * 1.0, sh_z - 0.01), sh_w * 0.44 * bulk, cc, scale=(0.95, 0.9, 0.9), parent=p)
    top_r = sh_w * 1.18 * 0.82
    # ロング特攻服の裾 (膝までフレア。脚を覆い靴だけ覗く)
    hem_z = cfg.get("chem_z", 0.14)
    if cfg.get("long_coat"):
        cyl((0, 0, (hip_z + hem_z) / 2 + 0.01), sh_w * 1.18 * bulk, sh_w * 0.98 * bulk, hip_z - hem_z + 0.05,
            cc, scale=(0.84, 1, 1), parent=p)
        torus((0, 0, hem_z + 0.01), sh_w * 1.16 * bulk, 0.016, cd, scale=(0.84, 1, 0.7), parent=p)
    # 赤帯 (白特攻服への色アクセント・総長の格。腰に巻き垂れを左に流す)
    if cfg.get("belt"):
        red = mat("cbelt", C(0.66, 0.09, 0.11), 0, 0.78)
        red_d = mat("cbelt_d", C(0.42, 0.05, 0.07), 0, 0.78)
        bz = hip_z + 0.04
        cyl((0, 0, bz), sh_w * 1.12 * bulk, sh_w * 1.06 * bulk, 0.13, red, scale=(0.84, 1, 1), parent=p)
        torus((0, 0, bz - 0.055), sh_w * 1.12 * bulk, 0.010, red_d, scale=(0.85, 1, 0.6), parent=p)
        torus((0, 0, bz + 0.055), sh_w * 1.12 * bulk, 0.010, red_d, scale=(0.85, 1, 0.6), parent=p)
        # 結び目 + 垂れ (カメラ側・左腰へ寄せて斜めに流す。中央に垂らさない)
        ky = -sh_w * 1.02 * bulk
        sph((sh_w * 0.70 * bulk, ky, bz), 0.040, red, scale=(1.1, 1.0, 1.0), parent=p)
        cyl((sh_w * 0.66 * bulk, ky - 0.02, bz - 0.09), 0.022, 0.016, 0.15, red,
            rot=(10, 0, -14), parent=p)
        torus((sh_w * 0.60 * bulk, ky - 0.04, bz - 0.16), 0.020, 0.006, red_d, rot=(0, 0, -14), parent=p)
    # 白さらし (腹に巻く)
    if cfg.get("sarashi"):
        sar = mat("csar", C(0.93, 0.92, 0.89), 0, 0.85)
        sar_d = mat("csar_d", C(0.78, 0.77, 0.74), 0, 0.85)
        cyl((0, 0, hip_z + 0.05), sh_w * 1.07 * bulk, sh_w * 1.0 * bulk, 0.15, sar, scale=(0.82, 1, 1), parent=p)
        for k in range(2):
            torus((0, 0, hip_z + 0.015 + k * 0.075), sh_w * 1.08 * bulk, 0.006, sar_d,
                  scale=(0.83, 1, 0.6), parent=p)
    # 金ボタン (前) + 前合わせライン
    for k in range(4):
        t = k / 3.0
        bz = sh_z - 0.06 - t * (sh_z - hip_z - 0.04)
        sph((top_r * 0.97 + 0.01, 0.025, bz), 0.022, gold, parent=p)
    box((top_r * 0.99, 0.012, (hip_z + sh_z) / 2), (0.016, 0.012, (sh_z - hip_z) * 0.5),
        cd, parent=p, bevel=0.004)
    # 詰襟 (立ち襟・内側黒)
    col_r = sh_w * 0.62
    cyl((0, 0, sh_z + 0.04), col_r * 1.10, col_r * 1.16, 0.10, cc, parent=p)
    cyl((0, 0, sh_z + 0.075), col_r * 0.95, col_r, 0.05, mat("cinner", PAL["black"], 0, 0.8), parent=p)
    if cfg.get("gold_trim"):                                  # 金の襟パイピング (ボスの豪華さ)
        torus((0, 0, sh_z + 0.095), col_r * 1.14, 0.011, gold, scale=(1, 1, 0.7), parent=p)
    # ---- 腕 (短い・拳を脇に。atk はカメラ側を前へ。武器持ちは肩担ぎ) ----
    wp = cfg.get("weapon")
    grip = None
    for sy in (1, -1):
        y0 = sy * sh_w * 1.05
        sh_pos = (0.0, y0, sh_z - 0.02)
        if wp and sy == -1 and POSE in ("idle", "idle2", "idle3"):
            # 杖立て: 腕を下げ脇でバットを握る (胸前を空けて龍を主役に・総長の風格)
            mid = (-0.01, y0 * 1.18, (sh_z + hip_z) / 2 + 0.02); f = (0.11, y0 * 1.26, hip_z + 0.05)
        elif wp and sy == -1 and POSE == "grd":
            mid = (0.06, y0 * 1.00, sh_z - 0.10); f = (0.18, y0 * 0.60, sh_z + 0.05)  # 前腕を立て縦構え
        elif POSE == "atk" and sy == -1:
            mid = (0.16, y0 * 0.95, sh_z - 0.06); f = (0.34, y0 * 0.82, sh_z - 0.10)
        elif POSE == "grd":
            mid = (0.10, y0 * 1.02, (sh_z + hip_z) / 2 + 0.05); f = (0.22, y0 * 0.55, hip_z + 0.14)
        else:
            mid = (-0.03, y0 * 1.14, (sh_z + hip_z) / 2); f = (-0.06, y0 * 1.18, hip_z + 0.04)
        seg(sh_pos, mid, sh_w * 0.42 * bulk, sh_w * 0.34 * bulk, cc, parent=p)
        seg(mid, f, sh_w * 0.34 * bulk, sh_w * 0.30, cc, parent=p)
        fist(p, f, r=0.072)
        if sy == -1:
            grip = f
    # 武器
    if wp == "bat_gold" and grip:
        chibi_weapon_bat(p, grip, POSE)
    # 刺繍 (カメラ側の裾)
    if cfg.get("embroidery") == "dragon":
        chibi_dragon_emb(p, sh_w, bulk, hem_z, hip_z)
    # ---- 頭 ----
    cz = sh_z + r * 0.95
    cyl((0, 0, sh_z + 0.02), r * 0.42, r * 0.46, 0.08, skin, parent=p)   # 短い首
    sph((0, 0, cz), r, skin, scale=(0.96, 0.95, 1.0), parent=p)
    chibi_face(p, cz, r, cfg)
    chibi_pompadour(p, cz, r, cfg)
    # 体全体のリーン (足元支点) + ヨー (顔をカメラ-Y側へ向けて3/4の見栄え)
    lean = {"atk": 8, "hit": -7, "grd": -3}.get(POSE, 0)
    yaw = {"atk": -7, "hit": -16, "grd": -20}.get(POSE, -13)
    p.rotation_euler = (0, D(lean), D(yaw))
    p.location.x = {"atk": -0.10, "hit": 0.04}.get(POSE, 0.0)
    return p


# ---- 雑魚チビの小物 ----
def chibi_cigarette(p, mouth):
    """咥えタバコ＋火種＋立ち昇る紫煙"""
    white = mat("cciga", C(0.93, 0.91, 0.87), 0, 0.6)
    tip = mat("cciga_tip", C(0.96, 0.42, 0.10), 0, 0.4)
    smoke = mat("csmoke", C(0.70, 0.70, 0.73), 0, 1.0)
    x, y, z = mouth
    cyl((x + 0.06, y - 0.02, z - 0.01), 0.013, 0.013, 0.14, white, rot=(0, 82, 0), parent=p)
    sph((x + 0.135, y - 0.02, z - 0.01), 0.016, tip, parent=p)
    # 細く軽い紫煙(斜め上へ流す)
    for k in range(3):
        t = k / 2.0
        sph((x + 0.14 + 0.05 * t, y - 0.02 - 0.02 * t, z + 0.07 + 0.10 * k),
            0.013 + 0.006 * k, smoke, parent=p)


def chibi_thinner_bag(p, hand):
    """シンナーを吸うビニール袋（口元の手に持つ・明色の半透明っぽい塊）"""
    bag = mat("cbag", C(0.86, 0.89, 0.86), 0, 0.25)
    x, y, z = hand
    sph((x + 0.02, y, z - 0.03), 0.062, bag, scale=(0.92, 1.0, 1.15), parent=p)
    sph((x + 0.02, y, z + 0.05), 0.030, bag, scale=(0.7, 0.7, 1.25), parent=p)   # 袋の口


def chibi_litter(p):
    """足元の散乱: つぶれた空き缶×2＋ワンカップ"""
    can = mat("ccan", C(0.76, 0.79, 0.83), 0.7, 0.3)
    can_r = mat("ccan_r", C(0.80, 0.20, 0.15), 0.4, 0.4)
    cup = mat("ccup", C(0.86, 0.91, 0.96), 0, 0.2)
    capm = mat("ccup_cap", PAL["gold"], 0.6, 0.35)
    cyl((0.30, 0.24, 0.05), 0.042, 0.046, 0.10, can_r, rot=(0, 72, 20), parent=p)
    cyl((0.36, -0.27, 0.045), 0.040, 0.040, 0.09, can, rot=(0, 86, -12), parent=p)
    cyl((0.16, -0.31, 0.05), 0.036, 0.042, 0.095, cup, parent=p)
    cyl((0.16, -0.31, 0.10), 0.036, 0.036, 0.012, capm, parent=p)


def chibi_radio(p):
    """肩乗せ風ラジカセ(足元横・カメラ側に置く)：昭和ヤンキーの象徴"""
    body = mat("cradio", C(0.13, 0.13, 0.15), 0.2, 0.5)
    spk = mat("cspk", C(0.55, 0.57, 0.62), 0.5, 0.4)
    sil = mat("cradio_sil", C(0.78, 0.80, 0.84), 0.7, 0.25)
    knob = mat("cknob", PAL["gold"], 0.6, 0.3)
    bx, by, bz = 0.28, -0.42, 0.13
    box((bx, by, bz), (0.30, 0.26, 0.22), body, parent=p, bevel=0.014)        # 本体(横長)
    for s in (-1, 1):                                                          # スピーカー2つ(カメラ側-Y)
        cyl((bx + s * 0.07, by - 0.115, bz - 0.01), 0.052, 0.052, 0.02, spk, rot=(90, 0, 0), parent=p)
        cyl((bx + s * 0.07, by - 0.125, bz - 0.01), 0.030, 0.030, 0.015, sil, rot=(90, 0, 0), parent=p)
    box((bx, by - 0.118, bz + 0.075), (0.10, 0.012, 0.03), sil, parent=p, bevel=0.004)  # 中央パネル
    for s in (-1, 0, 1):
        sph((bx + s * 0.03, by - 0.13, bz + 0.075), 0.011, knob, parent=p)    # ツマミ
    # 取っ手(上のアーチ)
    for sx in (-1, 1):
        seg((bx + sx * 0.09, by, bz + 0.11), (bx + sx * 0.05, by, bz + 0.19), 0.012, 0.012, body, parent=p)
    seg((bx - 0.05, by, bz + 0.19), (bx + 0.05, by, bz + 0.19), 0.012, 0.012, body, parent=p)


def build_chibi_zako(cfg):
    """雑魚チビ: ウンコ座り(完全しゃがみ・がに股)＋咥えタバコ/シンナー袋＋足元の缶/ラジカセ"""
    p = root()
    r = cfg.get("chead_r", 0.30)
    bulk = cfg.get("bulk", 1.0)
    sh_w = cfg.get("csh_w", 0.20)
    cc = mat("ccoat", cfg["coat"], 0, 0.9)
    pc = mat("cpants", cfg["pants"], 0, 0.9)
    skin = mat("cskin", PAL["skin"])
    shoe = mat("cshoe", PAL["black"], 0.1, 0.4)
    gold = mat("cgold", PAL["gold"], 0.6, 0.35)
    hip_z = 0.20
    sh_z = 0.50
    breath = {"idle": 0.0, "idle2": 0.010, "idle3": 0.018}.get(POSE, 0.0)
    sh_z += breath
    # ---- 脚: 完全しゃがみ・膝を高く前へ・がに股で平ら接地 ----
    for sy in (1, -1):
        foot = (0.17, sy * 0.18, 0.045)
        knee = (0.13, sy * 0.21, 0.40 + breath)
        hip = (-0.04, sy * 0.11, hip_z)
        seg(hip, knee, 0.115 * bulk, 0.10 * bulk, pc, parent=p)    # 腿(上向き)
        sph(knee, 0.097 * bulk, pc, parent=p)                      # 膝
        seg(knee, (foot[0], foot[1], foot[2] + 0.05), 0.097 * bulk, 0.072, pc, parent=p)  # 脛(下向き)
        sph((foot[0] + 0.05, foot[1], foot[2]), 0.095, shoe, scale=(1.85, 0.78, 0.5), parent=p)  # 平ら靴
    # ---- 尻・前傾の胴 ----
    sph((-0.07, 0, hip_z), 0.17 * bulk, pc, scale=(0.9, 1.12, 0.9), parent=p)
    cyl((-0.02, 0, (hip_z + sh_z) / 2 + 0.02), sh_w * 1.02 * bulk, sh_w * 1.06, sh_z - hip_z + 0.05,
        cc, scale=(0.84, 1, 1), rot=(0, 14, 0), parent=p)
    for sy in (1, -1):
        sph((0.03, sy * sh_w * 0.98, sh_z - 0.01), sh_w * 0.42 * bulk, cc, scale=(0.95, 0.9, 0.9), parent=p)
    top_r = sh_w * 1.06 * 0.82
    for k in range(3):
        sph((0.05 + top_r * 0.9, 0.02, sh_z - 0.06 - k * 0.07), 0.019, gold, parent=p)
    col_r = sh_w * 0.6
    cyl((0.05, 0, sh_z + 0.03), col_r * 1.10, col_r * 1.15, 0.08, cc, parent=p)
    # ---- 腕: カメラ側は口元へ(タバコ/袋)、反対は膝に乗せる ----
    yC = -sh_w * 1.0
    shC = (0.05, yC, sh_z - 0.02)
    if cfg.get("thinner"):   # シンナー袋を口元へ吸い上げる
        midC = (0.18, yC * 1.02, sh_z - 0.14); handC = (0.35, -sh_w * 0.5, sh_z + 0.06)
    else:                    # 膝の間にだらりと下ろす
        midC = (0.19, yC * 1.05, sh_z - 0.18); handC = (0.30, -sh_w * 0.55, 0.34)
    seg(shC, midC, sh_w * 0.40 * bulk, sh_w * 0.32 * bulk, cc, parent=p)
    seg(midC, handC, sh_w * 0.32 * bulk, sh_w * 0.28, cc, parent=p)
    fist(p, handC, r=0.07)
    yK = sh_w * 1.0
    shK = (0.05, yK, sh_z - 0.02)
    midK = (0.20, yK * 1.06, sh_z - 0.16)
    handK = (0.30, yK * 1.0, 0.42 + breath)   # 膝の上
    seg(shK, midK, sh_w * 0.40 * bulk, sh_w * 0.32 * bulk, cc, parent=p)
    seg(midK, handK, sh_w * 0.32 * bulk, sh_w * 0.28, cc, parent=p)
    fist(p, handK, r=0.07)
    # ---- 頭(やや前傾=うつむきガン飛ばし) ----
    cz = sh_z + r * 0.92
    cyl((0.02, 0, sh_z + 0.02), r * 0.40, r * 0.44, 0.07, skin, parent=p)
    sph((0, 0, cz), r, skin, scale=(0.96, 0.95, 1.0), parent=p)
    chibi_face(p, cz, r, cfg)
    chibi_pompadour(p, cz, r, cfg)
    # ---- 小物 ----
    mouth = (r * 0.95, -r * 0.06, cz - r * 0.5)
    if cfg.get("cigarette"):
        chibi_cigarette(p, mouth)
    if cfg.get("thinner"):
        chibi_thinner_bag(p, handC)
    if cfg.get("radio"):
        chibi_radio(p)
    chibi_litter(p)
    return p


def build_character(cfg):
    if cfg.get("chibi_zako"):
        return build_chibi_zako(cfg)
    if cfg.get("chibi"):
        return build_chibi(cfg)
    if cfg.get("rider"):
        p = root()
        build_rider(p, cfg)
        return p
    p = root()
    H = cfg["H"]
    bulk = cfg["bulk"]
    head_r = H * 0.084 * cfg.get("head_scale", 1.0)
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
        # 素手: 攻撃=正拳/被弾=のけぞり/ガード=ボクシング風の構え
        pose_cam, pose_far = {
            "idle": ("down", "down"), "idle2": ("down", "down"), "idle3": ("down", "down"),
            "atk": ("swing", "back"), "hit": ("flail", "down"), "grd": ("hold", "flail"),
        }[POSE]
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

def setup_scene(cfg=None):
    res = (cfg or {}).get("res", (560, 1000))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = res[0]
    scene.render.resolution_y = res[1]
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
    # カメラ: 3/4・水平・ortho。下端=z0 (足裏/タイヤ接地)
    az = D(32)
    R = 8.0
    base_scale = (cfg or {}).get("ortho", 2.30)
    # ortho_scale は解像度の長辺に対応する。縦長なら縦=scale、横長なら横=scale
    vert = base_scale if res[1] >= res[0] else base_scale * res[1] / res[0]
    oscale, zc = (base_scale, vert / 2.0) if ZOOM is None else (ZOOM[0], ZOOM[1])
    bpy.ops.object.camera_add(location=(R * math.sin(az), -R * math.cos(az), zc))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.pi / 2, 0, az)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = oscale
    scene.camera = cam
    # ライティング: キー強め+フィル弱+環境 (アニメ調のフラットさとメリハリ)
    bpy.ops.object.light_add(type="SUN", location=(4, -5, 6))
    key = bpy.context.active_object
    key.data.energy = (cfg or {}).get("key_e", 4.2)   # 白衣装は強めにして陰影を出す
    key.data.color = (1.0, 0.96, 0.90)
    key.rotation_euler = (D(58), 0, D(18))
    bpy.ops.object.light_add(type="POINT", location=(-2.5, 2.0, 2.4))
    rim = bpy.context.active_object
    rim.data.energy = (cfg or {}).get("rim_e", 600)   # 白衣装はリムを絞りエッジの白飛びを防ぐ
    rim.data.color = (0.85, 0.90, 1.0)
    bpy.ops.object.light_add(type="AREA", location=(2.5, 3.5, 2.0))
    fill = bpy.context.active_object
    fill.data.energy = (cfg or {}).get("fill_e", 150)   # 白衣装はフィルを絞り影側を残す
    fill.data.size = 5
    fill.rotation_euler = (D(72), 0, D(145))
    world = bpy.data.worlds.new("w") if scene.world is None else scene.world
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (1, 1, 1, 1)
    bg.inputs["Strength"].default_value = (cfg or {}).get("world_str", 0.42)  # 白衣装は環境光を絞り白飛び防止
    # (左右反転はレンダ後に flip_image_x() で行う。Blender5 は scene.node_tree 廃止のため)


# ============================================================
# キャラ定義
# ============================================================

CHARS = {
    # ラスボス 総長アンジョー: 2頭身チビ・白ロング特攻服・金龍刺繍・金バット・銀白リーゼント・傷 (最も豪華)
    "shin-anjo": {
        # 威圧感UP(hoshi指示②): 頭を相対的に小さく・肩幅と胴を増量し頭身を一段上げる。リーゼントも下げマスコット感解消
        "chibi": True, "bulk": 1.48,
        "chead_r": 0.285, "csh_z": 0.74, "chip_z": 0.37, "csh_w": 0.27,
        # 白特攻服は維持しつつ、白飛び回避でアイボリーに落とし陰影をクール鋼青で立体化(灰単一回避)
        "coat": C(0.82, 0.81, 0.75), "coat_dk": C(0.34, 0.37, 0.50),
        "pants": C(0.80, 0.79, 0.73), "pants_dk": C(0.34, 0.37, 0.50),
        "hair": C(0.66, 0.69, 0.80), "brow": C(0.18, 0.17, 0.22),  # 銀髪は冷たく/眉は濃く(虚ろ回避)
        "long_coat": True, "chem_z": 0.16, "weapon": "bat_gold", "embroidery": "dragon",
        "scar": True, "pompadour": 1.2, "gold_trim": True, "belt": True,  # 赤帯=白への決定的アクセント
        "stern_eyes": True,                                          # 据わった目=総長の睨み(hoshi指示①)
        "world_str": 0.08, "key_e": 6.0, "rim_e": 200, "fill_e": 22,  # 白特攻服=フィル絞り影側を残し立体化
        "res": (640, 940), "ortho": 2.02,
        "out": ("boss", "shin-anjo.png"),
    },
    # 中ボス 吉良の若殿マサキ: 紫・金刺繍・ヤセ長身・豪華木刀・頬傷
    "kira-yoshida": {
        "H": 2.00, "bulk": 1.15, "sh": 1.22,
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
        "H": 2.00, "bulk": 1.55, "sh": 1.48,
        "coat": PAL["dgreen"], "coat_dk": PAL["dgreen_dk"],
        "pants": PAL["dgreen"], "pants_dk": PAL["dgreen_dk"],
        "hair": PAL["hair_blk"], "brow": PAL["hair_blk"],
        "weapon": "guandao", "skinhead": True, "shirtless": True, "sunglasses": True,
        "face_scar_x": True,
        "out": ("boss", "nishio.png"),
    },
    # アーキタイプ17体目: スキンヘッドの殺し屋 (上半身裸・入れ墨・サングラス・青龍刀)
    "skinhead": {
        "H": 1.95, "bulk": 1.60, "sh": 1.50,
        "coat": PAL["coal"], "coat_dk": PAL["black"],
        "pants": PAL["black"], "pants_dk": PAL["coal"],
        "hair": PAL["hair_blk"], "brow": PAL["hair_blk"],
        "weapon": "guandao", "skinhead": True, "shirtless": True, "sunglasses": True,
        "face_scar_x": True,
        "out": (None, "skinhead.png"),
    },
    # 主人公: 2頭身チビ・黒髪リーゼント・黒学ラン+白さらし・黒ボンタン・不敵 (一番かっこよく)
    #   no_flip=True (ゲームが scaleX(+1) 無反転表示。db7fe81 で確定)
    "player": {
        "chibi": True, "no_flip": True, "bulk": 1.05,
        "chead_r": 0.30, "csh_z": 0.62, "chip_z": 0.32, "csh_w": 0.20,
        "coat": C(0.08, 0.10, 0.27), "coat_dk": C(0.03, 0.04, 0.12),
        "pants": C(0.07, 0.08, 0.22), "pants_dk": C(0.03, 0.03, 0.10),
        "hair": C(0.05, 0.06, 0.10), "brow": C(0.05, 0.05, 0.08),
        "sarashi": True, "pompadour": 1.3,
        "res": (640, 900), "ortho": 1.72,
        "out": (None, "player.png"),
    },
    # 標準雑魚: 2頭身チビ・ウンコ座り＋咥えタバコ＋シンナー袋＋足元の空き缶
    "yankee-basic": {
        "chibi_zako": True, "bulk": 1.0,
        "chead_r": 0.30, "csh_w": 0.20,
        "coat": C(0.16, 0.16, 0.21), "coat_dk": C(0.08, 0.08, 0.11),
        "pants": C(0.12, 0.12, 0.17), "pants_dk": C(0.06, 0.06, 0.09),
        "hair": C(0.10, 0.08, 0.06), "brow": C(0.10, 0.08, 0.06),
        "pompadour": 1.0, "cigarette": True,
        "res": (640, 760), "ortho": 1.35,
        "out": (None, "yankee-basic.png"),
    },
    # 炎の不良(雑魚): ウンコ座り＋シンナー(ビニール袋)を口元で吸う・赤黒・赤リーゼント
    "yankee-fire": {
        "chibi_zako": True, "bulk": 1.0,
        "chead_r": 0.30, "csh_w": 0.20,
        "coat": C(0.28, 0.07, 0.06), "coat_dk": C(0.14, 0.03, 0.03),
        "pants": C(0.14, 0.06, 0.06), "pants_dk": C(0.07, 0.03, 0.03),
        "hair": C(0.40, 0.06, 0.04), "brow": C(0.22, 0.05, 0.03),
        "pompadour": 1.05, "thinner": True,
        "res": (640, 760), "ortho": 1.35,
        "out": (None, "yankee-fire.png"),
    },
    # 漁師町の不良(雑魚): ウンコ座り＋肩乗せラジカセ＋足元に酒(ワンカップ/缶)・紺
    "yankee-fisher": {
        "chibi_zako": True, "bulk": 1.0,
        "chead_r": 0.30, "csh_w": 0.20,
        "coat": C(0.10, 0.14, 0.26), "coat_dk": C(0.05, 0.07, 0.13),
        "pants": C(0.08, 0.10, 0.18), "pants_dk": C(0.04, 0.05, 0.09),
        "hair": C(0.08, 0.10, 0.14), "brow": C(0.08, 0.10, 0.14),
        "pompadour": 1.0, "cigarette": True, "radio": True,
        "res": (700, 760), "ortho": 1.45,
        "out": (None, "yankee-fisher.png"),
    },
    # 暴走族ライダー: 旧車會単車に跨がった特攻服の不良 (idle/idle2=エンジン振動 のみ)
    "rider": {
        "rider": True,
        "coat": PAL["white"], "coat_dk": PAL["offwhite"],
        "pants": PAL["white"], "pants_dk": PAL["offwhite"],
        "hair": PAL["hair_blk"], "bike": C(0.12, 0.22, 0.58),
        "pompadour": 1.15,
        "res": (900, 700), "ortho": 2.85,
        "out": (None, "rider.png"),
    },
}


def flip_image_x(path):
    """ファイル基準の向きは『素のPNGで顔が左向き』(aad3447 時点の main に一致)。
    カメラ既定は右向きなのでレンダ後に左右反転して保存する。
    ※向きがおかしく見えても画像を反転せず #名鉄 で要相談 (反転合戦が3回起きた)"""
    import numpy as np
    img = bpy.data.images.load(path)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)[:, ::-1, :].ravel()
    img.pixels.foreach_set(px)
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def render_one(cid):
    cfg = CHARS[cid]
    if cfg.get("rider") and POSE not in ("idle", "idle2"):
        return  # ライダーは idle + エンジン振動の2枚のみ
    clear()
    setup_scene(cfg)
    build_character(cfg)
    sub, fn = cfg.get("out", ("boss", cid + ".png"))
    fn = fn[:-4] + POSE_SUFFIX[POSE] + ".png"
    out = OUT_OVERRIDE or os.path.join(BOSS_DIR if sub == "boss" else CHAR_DIR, fn)
    bpy.context.scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    if not cfg.get("no_flip"):
        flip_image_x(out)  # 敵パイプライン(scaleX(-1)表示)用の標準向き
    print("WROTE", out)


targets = list(CHARS.keys()) if ALL else [ONLY or "shin-anjo"]
poses = POSES_ALL if ALL else (POSE,)
for cid in targets:
    for POSE in poses:
        render_one(cid)
