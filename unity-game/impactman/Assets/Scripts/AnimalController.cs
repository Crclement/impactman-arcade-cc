using System.Collections;
using System.Collections.Generic;
using DG.Tweening.Core.Easing;
using UnityEngine;

public class AnimalController : MonoBehaviour
{
    public Transform movePoint;

    public AnimationClip spriteUp;
    public AnimationClip spriteDown;
    public AnimationClip spriteLeft;
    public AnimationClip spriteRight;

    protected Animator animator;
    protected AnimatorOverrideController animatorOverrideController;

    private GameManager gameManagerScript;

    public Vector3 targetPosition = Vector3.zero;

    private Vector3 direction = Vector3.zero;
    private Vector3 currentDirection = Vector3.zero;

    // Start is called before the first frame update
    void Start()
    {
        animator = GetComponent<Animator>();
        animatorOverrideController = new AnimatorOverrideController(animator.runtimeAnimatorController);
        animator.runtimeAnimatorController = animatorOverrideController;

        gameManagerScript = GameObject.Find("GameManager").GetComponent<GameManager>();

        SetSprite();
    }

    // Update is called once per frame
    void Update()
    {
        HandleTarget();
        HandleMovement();
        HandleMovePoint();
    }

    void HandleTarget()
    {
        float d = Vector3.Distance(movePoint.transform.position, targetPosition);

        if(d < 16)
        {
            gameManagerScript.DestroyAnimal();
        }
    }

    void HandleMovePoint()
    {
        float distance = Vector3.Distance(transform.position, movePoint.transform.position);
        // Debug.Log($"distance {distance}");
        if (distance <= 1f)
        {
            direction = DirectionTo(movePoint.transform.position, targetPosition);

            if (direction != Vector3.zero)
            {
                movePoint.transform.position += direction * 32;

                if (direction == Vector3.up)
                {
                    GetComponent<Animator>().SetInteger("direction", 1);
                }
                else if (direction == Vector3.right)
                {
                    GetComponent<Animator>().SetInteger("direction", 2);
                }
                else if (direction == Vector3.down)
                {
                    GetComponent<Animator>().SetInteger("direction", 3);
                }
                else if (direction == Vector3.left)
                {
                    GetComponent<Animator>().SetInteger("direction", 0);
                }
            }
        }
    }

    void HandleMovement()
    {
        transform.position = Vector3.MoveTowards(transform.position, movePoint.transform.position, Time.deltaTime * 32 * 3f);
    }

    void SetSprite()
    {
        AnimationClipOverrides clipOverrides = new AnimationClipOverrides(animatorOverrideController.overridesCount);
        animatorOverrideController.GetOverrides(clipOverrides);

        AnimationClip up = spriteUp;
        AnimationClip down = spriteDown;
        AnimationClip left = spriteLeft;
        AnimationClip right = spriteRight;

        foreach (AnimationClip clip in animatorOverrideController.animationClips)
        {
            clipOverrides["Ghost1Up"] = up;
            clipOverrides["Ghost1Down"] = down;
            clipOverrides["Ghost1Left"] = left;
            clipOverrides["Ghost1Right"] = right;
        }
        animatorOverrideController.ApplyOverrides(clipOverrides);
    }

    List<Vector3> GetPossibleDirection(Vector3 point)
    {
        // Fix Z issue
        point.z = 0;

        bool canMoveLeft = CheckColission(point, Vector3.left);
        bool canMoveRight = CheckColission(point, Vector3.right);
        bool canMoveUp = CheckColission(point, Vector3.up);
        bool canMoveDown = CheckColission(point, Vector3.down);

        List<Vector3> possibleDirections = new List<Vector3>();

        if (canMoveRight && direction != Vector3.left)
        {
            possibleDirections.Add(Vector3.right);
        }
        if (canMoveLeft && direction != Vector3.right)
        {
            possibleDirections.Add(Vector3.left);
        }
        if (canMoveDown && direction != Vector3.up)
        {
            possibleDirections.Add(Vector3.down);
        }
        if (canMoveUp && direction != Vector3.down)
        {
            possibleDirections.Add(Vector3.up);
        }

        return possibleDirections;
    }

    bool CheckColission(Vector3 from, Vector3 dir)
    {
        LayerMask mask = LayerMask.GetMask("Wall");
        RaycastHit2D hit = Physics2D.Raycast(from - new Vector3(8, 8, 0), dir, 32, mask);

        if (hit.collider != null)
        {
            return true;
        }

        return false;
    }

    Vector3 DirectionTo(Vector3 from, Vector3 destination)
    {
        // Fix Z issue
        from.z = 0;
        destination.z = 0;

        // Initialize both open and closed list
        Dictionary<Vector3, PathNode> opens = new Dictionary<Vector3, PathNode>();
        Dictionary<Vector3, PathNode> closed = new Dictionary<Vector3, PathNode>();

        // Add the start node
        opens.Add(from, new PathNode(from, 0, null));


        // If it's on the destination already
        if (from == destination)
        {
            List<Vector3> initialPossibleDirections = GetPossibleDirection(from);

            if (initialPossibleDirections.Contains(currentDirection))
            {
                return currentDirection;
            }

            // Get random direction
            return initialPossibleDirections[Random.Range(0, initialPossibleDirections.Count)];
        }

        // Loop until you find the end
        int loops = 0;
        while (opens.Count > 0)
        {
            // Get the current node with the minimum distance
            float minDistance = float.PositiveInfinity;
            PathNode selectedNode = null;

            foreach (KeyValuePair<Vector3, PathNode> open in opens)
            {
                float distance = Vector3.Distance(open.Key, destination);

                if (distance < minDistance)
                {
                    selectedNode = open.Value;
                    minDistance = distance;
                }
            }

            // Remove the currentNode from the openList and add it to the closedList
            opens.Remove(selectedNode.position);
            closed.Add(selectedNode.position, selectedNode);

            float d = Vector3.Distance(selectedNode.position, destination);

            // Found the destination
            if (d < 8)
            {
                while (selectedNode.parent != null && selectedNode.parent.position != from)
                {
                    selectedNode = selectedNode.parent;
                }

                Vector3 direction = (selectedNode.position - from) / 32;
                direction.z = 0;

                return direction;
            }

            // Generate children
            List<Vector3> possibleDirections = GetPossibleDirection(selectedNode.position);

            // Prevent from changing direction
            if (loops == 0)
            {
                possibleDirections.Remove(currentDirection * -1);

                if (possibleDirections.Count == 0)
                {
                    return currentDirection * -1;
                }
            }

            loops += 1;

            // For each child in the children
            foreach (Vector3 possibleDirection in possibleDirections)
            {
                Vector3 pos = selectedNode.position + (possibleDirection * 32);
                pos.z = 0;

                // Child is on the closedList
                if (closed.ContainsKey(pos))
                {
                    continue;
                }

                // Create the f, g, and h values
                float g = Vector3.Distance(selectedNode.position, pos);
                float h = Vector3.Distance(pos, destination);
                float f = g + h;

                // Child is already in the openList
                if (opens.ContainsKey(pos))
                {
                    // If the new f cost is lower than the old one, update the node
                    if (f < opens[pos].distance)
                    {
                        opens[pos].distance = f;
                    }
                }
                else
                {
                    // Add the child to the openList
                    opens.Add(pos, new PathNode(pos, f, selectedNode));
                }
            }
        }

        return currentDirection;
    }
}
