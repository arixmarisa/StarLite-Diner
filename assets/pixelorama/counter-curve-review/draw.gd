const W = 64
const H = 72
const OFFSET = Vector2i(8, 8)
const INNER_RADIUS = 16.0
const OUTER_RADIUS = 40.0

func run(api, image, project, params):
	if project.size != Vector2i(64, 72) or project.layers.size() != 4:
		return {"error": "Expected64x72 four-layer curved-counter source"}
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color.TRANSPARENT)
	var role = int(params.role)
	var reference_dir = str(params.reference_dir)
	var native_top = Image.load_from_file(reference_dir.path_join("counter-top.png"))
	var native_front = Image.load_from_file(reference_dir.path_join("counter-front.png"))
	if native_top.get_size() != Vector2i(16, 24) or native_front.get_size() != Vector2i(16, 16):
		return {"error": "Expected unchanged v1 counter-top16x24 and counter-front16x16"}
	for x in range(40):
		var lowest_top_y = -1
		for y in range(40):
			var px = float(x) + 0.5
			var py = float(y) + 0.5
			var radius = sqrt(px * px + py * py)
			if radius < INNER_RADIUS or radius >= OUTER_RADIUS:
				continue
			lowest_top_y = y
			var band = clampi(int(floor(radius)) - 16, 0, 23)
			if (role == 2 and band <= 19) or (role == 3 and band >= 20):
				output.set_pixel(x + OFFSET.x, y + OFFSET.y, native_top.get_pixel(0, band))
		if lowest_top_y < 0:
			continue
		var outer_angle = atan2(float(lowest_top_y) + 0.5, float(x) + 0.5)
		var distance_from_west = (PI * 0.5 - outer_angle) * OUTER_RADIUS
		var panel_column = int(floor(distance_from_west)) % 16
		for row in range(16):
			var belongs = (role == 0 and row >= 12) or (role == 1 and row >= 4 and row <= 11) or (role == 3 and row <= 3)
			if belongs:
				output.set_pixel(x + OFFSET.x, lowest_top_y + 1 + row + OFFSET.y, native_front.get_pixel(panel_column, row))
	return output
