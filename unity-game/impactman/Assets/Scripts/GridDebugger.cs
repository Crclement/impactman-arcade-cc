using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

[ExecuteInEditMode]
public class GridDebugger : MonoBehaviour
{
    public Tilemap tilemap;

    private float delta = 0f;

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        if(delta < 1f){
            delta += Time.deltaTime;
            return;
        }

        delta = 0f;
        foreach (Vector3Int position in tilemap.cellBounds.allPositionsWithin){
            GridLayout gridLayout = tilemap.GetComponentInParent<GridLayout>();
            Vector3 cellPosition = gridLayout.CellToWorld(position);

            DrawBox(cellPosition, Color.green, 10f);
        }
    }

    void DrawBox(Vector3 position, Color color, float time){
        Debug.DrawLine(position, position + new Vector3(32,0,0), color, time);
        Debug.DrawLine(position, position + new Vector3(0,32,0), color, time);
        Debug.DrawLine(position + new Vector3(32,0,0), position + new Vector3(32,32,0), color, time);
        Debug.DrawLine(position + new Vector3(0,32,0), position + new Vector3(32,32,0), color, time);
    }
}
