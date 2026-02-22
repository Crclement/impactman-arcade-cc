using System;
using UnityEngine;

public class PathNode
{
	public float distance = float.PositiveInfinity;
	public PathNode parent = null;
	public Vector3 position = Vector3.zero;

	public PathNode(Vector3 position, float distance, PathNode parent = null)
	{
		this.distance = distance;
		this.parent = parent;
		this.position = position;
	}
}

