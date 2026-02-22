using System;
using UnityEngine;

public static class GridHelper
{
	public static Vector3 GetPosition(int x, int y)
	{
        Vector3 position = (new Vector3(x - 13, 14 - y,0) * 32) + new Vector3(16,0);

        return position;
	}

    public static void DrawBox(Vector3 position, Color color, float time = 100, int depth = 1)
    {
        position = position - new Vector3(16, 16, 0);
        Debug.DrawLine(position, position + new Vector3(32, 0, 0), color, time);
        Debug.DrawLine(position, position + new Vector3(0, 32, 0), color, time);
        Debug.DrawLine(position + new Vector3(32, 0, 0), position + new Vector3(32, 32, 0), color, time);
        Debug.DrawLine(position + new Vector3(0, 32, 0), position + new Vector3(32, 32, 0), color, time);
    }
}

