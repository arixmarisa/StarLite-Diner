func run(api,image,project,params):
	var results=[]
	for filename in ["rear-toppings-rail.png","prep-bins-insert.png","steel-empty-bin.png"]:
		var picture=Image.load_from_file(str(params.output_dir).path_join(filename))
		var width=picture.get_width()
		var height=picture.get_height()
		var visited={}
		var holes=[]
		for y in range(height):
			for x in range(width):
				var key=y*width+x
				if visited.has(key) or picture.get_pixel(x,y).a>0:
					continue
				var queue=[Vector2i(x,y)]
				visited[key]=true
				var boundary=false
				var head=0
				while head<queue.size():
					var point=queue[head]
					head+=1
					if point.x==0 or point.y==0 or point.x==width-1 or point.y==height-1:
						boundary=true
					for offset in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
						var neighbor=point+offset
						if neighbor.x<0 or neighbor.y<0 or neighbor.x>=width or neighbor.y>=height:
							continue
						var neighbor_key=neighbor.y*width+neighbor.x
						if not visited.has(neighbor_key) and picture.get_pixel(neighbor.x,neighbor.y).a==0:
							visited[neighbor_key]=true
							queue.append(neighbor)
				if not boundary:
					holes.append(queue.size())
		results.append({"image":filename,"transparentHoles":holes,"holeCount":holes.size()})
	var file=FileAccess.open(str(params.output_dir).path_join("hole-verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(results,"  ")+"\n")
	file.close()
	return results
