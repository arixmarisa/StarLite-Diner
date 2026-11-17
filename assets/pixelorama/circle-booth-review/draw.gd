const W = 128
const H = 112
const CX = 64.0
const CY = 60.0
const Y_SCALE = 0.8
const PALETTE = ["#322c38", "#46404b", "#676c70", "#9ba8a5", "#d5dfd3", "#fff0d5", "#9f385e", "#c94d7b", "#ee75a3", "#ffacc9", "#ffd2de", "#a6bcb2", "#f1e5d1", "#fff5df"]

func ring_mask(z, outer, inner, part = 0, dx = 0.0, dy = 0.0):
	var mask = PackedByteArray()
	mask.resize(W * H)
	for y in range(H):
		for x in range(W):
			var px = float(x) + 0.5 - CX - dx
			var py = (float(y) + 0.5 - (CY - z) - dy) / Y_SCALE
			var radius = sqrt(px * px + py * py)
			var angle = fposmod(rad_to_deg(atan2(py, px)), 360.0)
			var in_arc = angle <= 278.0 or angle >= 350.0
			var in_part = part == 0 or (part == -1 and py <= 0.0) or (part == 1 and py > 0.0)
			if radius <= outer and radius >= inner and in_arc and in_part:
				mask[y * W + x] = 1
	return mask

func solid(mask, x, y):
	return x >= 0 and y >= 0 and x < W and y < H and mask[y * W + x] == 1

func edge(mask, x, y):
	return not solid(mask, x - 1, y) or not solid(mask, x + 1, y) or not solid(mask, x, y - 1) or not solid(mask, x, y + 1)

func extrude(mask, height):
	var result = PackedByteArray()
	result.resize(W * H)
	for y in range(H):
		for x in range(W):
			for shift in range(height + 1):
				if solid(mask, x, y - shift):
					result[y * W + x] = 1
					break
	return result

func put(output, x, y, color):
	if x >= 0 and y >= 0 and x < W and y < H:
		output.set_pixel(x, y, Color(PALETTE[color]))

func ellipse_mask(cx, cy, rx, ry):
	var mask = PackedByteArray()
	mask.resize(W * H)
	for y in range(H):
		for x in range(W):
			var xx = (float(x) + 0.5 - cx) / rx
			var yy = (float(y) + 0.5 - cy) / ry
			if xx * xx + yy * yy <= 1.0:
				mask[y * W + x] = 1
	return mask

func nearest_seam(px, py):
	var distance = 1000.0
	var signed_distance = 0.0
	for i in range(1, 8):
		var angle = deg_to_rad(350.0 + float(i) * 36.0)
		var along = px * cos(angle) + py * sin(angle)
		var cross = py * cos(angle) - px * sin(angle)
		if along > 0.0 and abs(cross) < distance:
			distance = abs(cross)
			signed_distance = cross
	return [distance, signed_distance]

func draw_back(output, part):
	var cap = ring_mask(18.0, 48.0, 40.0, part)
	var full_cap = ring_mask(18.0, 48.0, 40.0)
	var face = extrude(cap, 12)
	for y in range(H):
		for x in range(W):
			if solid(face, x, y):
				var minimum_shift = 12
				for shift in range(13):
					if solid(cap, x, y - shift):
						minimum_shift = shift
						break
				var color = 7 if part == 1 else 8
				if minimum_shift >= 9:
					color = 6 if part == 1 else 7
				if edge(face, x, y):
					color = 0
				put(output, x, y, color)
			if solid(cap, x, y):
				var px = float(x) + 0.5 - CX
				var py = (float(y) + 0.5 - (CY - 18.0)) / Y_SCALE
				var radius = sqrt(px * px + py * py)
				var color = 8
				if radius > 45.0:
					color = 10 if px < 0.0 or py < 0.0 else 9
				if radius < 42.0:
					color = 7
				if edge(full_cap, x, y):
					color = 0
				put(output, x, y, color)

func run(api, image, project, params):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color.TRANSPARENT)
	var role = int(params.role)
	if role == 0:
		var shadow = ring_mask(-3.0, 49.0, 25.0, 0, 1.0, 0.0)
		for y in range(H):
			for x in range(W):
				if solid(shadow, x, y):
					put(output, x, y, 1)
		var foot_shadow = ellipse_mask(65.0, 85.0, 12.0, 4.0)
		for y in range(H):
			for x in range(W):
				if solid(foot_shadow, x, y):
					put(output, x, y, 1)
	elif role == 1:
		var plinth = extrude(ring_mask(3.0, 48.0, 28.0), 4)
		for y in range(H):
			for x in range(W):
				if solid(plinth, x, y):
					var color = 2
					if edge(plinth, x, y):
						color = 0
					elif not solid(plinth, x, y - 2):
						color = 4
					elif x < 64:
						color = 3
					put(output, x, y, color)
	elif role == 2:
		draw_back(output, -1)
	elif role == 3:
		var seat = ring_mask(6.0, 40.0, 28.0)
		for y in range(H):
			for x in range(W):
				if solid(seat, x, y):
					var px = float(x) + 0.5 - CX
					var py = (float(y) + 0.5 - (CY - 6.0)) / Y_SCALE
					var radius = sqrt(px * px + py * py)
					var color = 8
					if radius > 38.5:
						color = 7
					elif radius < 30.0:
						color = 9 if px < 0.0 or py < 0.0 else 7
					if edge(seat, x, y):
						color = 0
					put(output, x, y, color)
	elif role == 4:
		var foot = ellipse_mask(64.0, 81.0, 11.0, 4.0)
		for y in range(H):
			for x in range(W):
				if solid(foot, x, y):
					put(output, x, y, 0 if edge(foot, x, y) else 2)
		output.fill_rect(Rect2i(60, 63, 8, 19), Color(PALETTE[0]))
		output.fill_rect(Rect2i(61, 63, 6, 17), Color(PALETTE[3]))
		output.fill_rect(Rect2i(62, 63, 2, 17), Color(PALETTE[4]))
	elif role == 5:
		var table = ellipse_mask(64.0, 50.0, 25.0, 20.0)
		var lip = ellipse_mask(64.0, 52.0, 25.0, 20.0)
		for y in range(H):
			for x in range(W):
				if solid(lip, x, y):
					put(output, x, y, 0 if edge(lip, x, y) else 2)
				if solid(table, x, y):
					var color = 12
					if edge(table, x, y):
						color = 0
					elif not solid(table, x - 2, y) or not solid(table, x + 2, y) or not solid(table, x, y - 2) or not solid(table, x, y + 2):
						color = 11
					elif not solid(table, x - 3, y) or not solid(table, x, y - 3):
						color = 13
					put(output, x, y, color)
	elif role == 6:
		draw_back(output, 1)
	elif role == 7:
		var cap = ring_mask(18.0, 48.0, 40.0)
		var seat = ring_mask(6.0, 40.0, 28.0)
		var foreground = extrude(ring_mask(18.0, 48.0, 40.0, 1), 12)
		for y in range(H):
			for x in range(W):
				if solid(cap, x, y) and not edge(cap, x, y):
					var px = float(x) + 0.5 - CX
					var py = (float(y) + 0.5 - (CY - 18.0)) / Y_SCALE
					var seam = nearest_seam(px, py)
					if seam[0] < 0.65:
						put(output, x, y, 6)
					elif seam[0] < 1.4 and seam[1] > 0.0:
						put(output, x, y, 9)
				elif solid(seat, x, y) and not edge(seat, x, y) and not solid(foreground, x, y):
					var px = float(x) + 0.5 - CX
					var py = (float(y) + 0.5 - (CY - 6.0)) / Y_SCALE
					var seam = nearest_seam(px, py)
					if seam[0] < 0.65:
						put(output, x, y, 6)
					elif seam[0] < 1.4 and seam[1] > 0.0:
						put(output, x, y, 10)
	return output
