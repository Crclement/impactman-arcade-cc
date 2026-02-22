using System.Collections;
using System.Collections.Generic;
using Unity.Burst.CompilerServices;
using UnityEngine;
using UnityEngine.Tilemaps;

public class TunnelController : MonoBehaviour
{
    public GameObject leftTunnel;
    public GameObject rightTunnel;

    public GameObject WalkPath;

    private Vector3 rightTilePosition;
    private Vector3 leftTilePosition;

    // Start is called before the first frame update
    void Start()
    {
        GetTransportPositions();
    }

    void GetTransportPositions()
    {
        
        Tilemap walkPathTilemap = WalkPath.GetComponent<Tilemap>();

        Vector3 leftPoint = leftTunnel.transform.position + (Vector3.right * 64);
        Vector3 rightPoint = rightTunnel.transform.position + (Vector3.left * 64);

        leftTilePosition = (walkPathTilemap.WorldToCell(leftPoint) * 32) + new Vector3(16, 32);
        rightTilePosition = (walkPathTilemap.WorldToCell(rightPoint) * 32) + new Vector3(16, 32);

        GridHelper.DrawBox(leftTilePosition, Color.magenta, 100);
        GridHelper.DrawBox(rightTilePosition, Color.magenta, 100);
    }

    // Update is called once per frame
    void FixedUpdate()
    {
        LayerMask mask = LayerMask.GetMask("Player", "Enemies");
        RaycastHit2D leftHit = Physics2D.Raycast(leftTunnel.transform.position, Vector3.right, 16, mask);
        RaycastHit2D rightHit = Physics2D.Raycast(rightTunnel.transform.position, Vector3.left, 16, mask);

        Debug.DrawLine(leftTunnel.transform.position, leftTunnel.transform.position + (Vector3.right * 16), Color.black);
        Debug.DrawLine(rightTunnel.transform.position, rightTunnel.transform.position + (Vector3.left * 16), Color.black);

        if (leftHit.collider != null)
        {
            HandleCollision(leftHit, true);
        }

        if (rightHit.collider != null)
        {
            HandleCollision(rightHit, false);
        }
    }

    void HandleCollision(RaycastHit2D hit, bool isLeft)
    {
        Transform objectHit = hit.transform;

        Vector3 destination = isLeft ? rightTilePosition : leftTilePosition;

        if (objectHit.name.Contains("Ghost"))
        {
            GhostController controller = objectHit.transform.GetComponent<GhostController>();

            controller.MoveTo(destination);
        } else if (objectHit.name.Contains("Player"))
        {
            PlayerController controller = objectHit.transform.GetComponent<PlayerController>();

            controller.MoveTo(destination);
        }

        // Debug.Log($"Hit {objectHit.name}");
    }
}
