using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    private Vector3 direction = Vector3.left;
    public Vector3 movingDirection = Vector3.left;
    public Transform movePoint;

    private float speed = 4f;

    private bool canMoveLeft = true;
    private bool canMoveRight = true;
    private bool canMoveUp = true;
    private bool canMoveDown = true;

    private bool shouldBeMoving = false;

    private bool dead = false;

    private bool hasInput = false;
    private Animator animator = null;

    // Start is called before the first frame update
    void Start()
    {
        movePoint.parent = null;

        animator = GetComponent<Animator>();
        animator.enabled = false;
    }

    public void Init(float speedPercentage){
        shouldBeMoving = true;
        this.speed = GlobalVariables.Get<float>("maximumSpeed") * speedPercentage;
        GetComponent<Animator>().enabled = true;

        Debug.Log($"player speed: {speed}");
    }

    public void Resume(){
        shouldBeMoving = true;
        GetComponent<Animator>().enabled = true;
    }

    public void Stop(){
        shouldBeMoving = false;
        GetComponent<Animator>().enabled = false;
    }

    public void MoveTo(Vector3 position)
    {
        movePoint.transform.position = position;
        transform.position = position - (direction * 16);

        HandleAnimation();
    }

    // Update is called once per frame
    void Update()
    {
        if(!shouldBeMoving)
        {
            return;
        }
    }

    void FixedUpdate() {
        if(!shouldBeMoving)
        {
            return;
        }
        HandleCollisions();
        CalculateDirection();
        HandleAnimation();
        HandleMovement();
        
        
        if (!this.dead) {
            HandleMovePoint();
            HandleCollectables();
            HandleEnemyHit();
        }
    }

    void HandleEnemyHit(){
        LayerMask mask = LayerMask.GetMask("Enemies");

        Collider2D hitLeft = (Physics2D.Raycast(transform.position, Vector3.left, 24, mask)).collider;
        Collider2D hitRight = (Physics2D.Raycast(transform.position, Vector3.right, 24, mask)).collider;
        Collider2D hitUp = (Physics2D.Raycast(transform.position, Vector3.up, 24, mask)).collider;
        Collider2D hitDown = (Physics2D.Raycast(transform.position, Vector3.down, 24, mask)).collider;

        Collider2D hit = hitLeft ?? hitRight ?? hitUp ?? hitDown;

        if(hit){
            if(hit.gameObject.GetComponent<GhostController>().CanBeKilled()){
                hit.gameObject.GetComponent<GhostController>().StartDead();
                SendMessageUpwards("EnemyKilled");
            } else {
                Animator animator = GetComponent<Animator>();

                animator.SetBool("dead", true);
                this.dead = true;
                SendMessageUpwards("GameOver");
            }
        }
    }

    void HandleCollectables(){
        LayerMask mask = LayerMask.GetMask("Collectables");
        Vector3 dir = (movePoint.position - transform.position).normalized;
        RaycastHit2D hit = Physics2D.Raycast(transform.position, dir, 32, mask);

        Debug.DrawLine(transform.position, transform.position + dir * 32, Color.green);

        if(hit.collider != null){
            CollectableScript collectable = hit.collider.gameObject.GetComponent<CollectableScript>();

            collectable.Collect();

            // Debug.Log($"Hit: {hit.collider}");
        }
    }


    void HandleCollisions(){
        canMoveDown = CheckColission(Vector3.down);
        canMoveUp = CheckColission(Vector3.up);
        canMoveLeft = CheckColission(Vector3.left);
        canMoveRight = CheckColission(Vector3.right);

        // Debug.Log($"L {canMoveLeft} - R {canMoveRight} - U {canMoveUp} - D {canMoveDown}");
    }

    bool CheckColission(Vector3 dir) {
        LayerMask mask = LayerMask.GetMask("Wall");
        RaycastHit2D hit = Physics2D.Raycast(movePoint.transform.position, dir, 32, mask);

        //Debug.DrawLine(movePoint.transform.position, movePoint.transform.position + (dir * 32), Color.red);

        if (hit.collider != null){
            return true;
        }

        return false;
    }

    void HandleMovePoint(){
        float distance = Vector3.Distance(transform.position, movePoint.transform.position);

        float offset = direction == movingDirection ? 4 : 32;

        Debug.DrawLine(transform.position, movePoint.transform.position, Color.magenta);

        if(distance <= offset){
            if(direction != Vector3.zero){
                if(direction == Vector3.left && canMoveLeft){
                    movePoint.transform.position += direction * 32;
                    this.movingDirection = Vector3.left;
                }
                else if(direction == Vector3.right && canMoveRight){
                    movePoint.transform.position += direction * 32;
                    this.movingDirection = Vector3.right;
                }
                else if(direction == Vector3.up && canMoveUp){
                    movePoint.transform.position += direction * 32;
                    this.movingDirection = Vector3.up;
                }
                else if(direction == Vector3.down && canMoveDown){
                    movePoint.transform.position += direction * 32;
                    this.movingDirection = Vector3.down;
                }
            }
        }
    }

    void HandleMovement(){
        transform.position = Vector3.MoveTowards(transform.position, movePoint.transform.position, Time.deltaTime * 32 * speed);
    }

    void HandleAnimation(){
        if(direction == Vector3.left){
            animator.SetInteger("Direction", 0);
        } else if(direction == Vector3.right){
            animator.SetInteger("Direction", 2);
        } else if(direction == Vector3.up){
            animator.SetInteger("Direction", 1);
        } else if(direction == Vector3.down){
            animator.SetInteger("Direction", 3);
        }

        // Rotate to face direction

        Vector3 diff = movePoint.transform.position - transform.position;
        diff.Normalize();

        float rotZ = Mathf.Atan2(diff.y, diff.x) * Mathf.Rad2Deg;
        float roundedRot = Mathf.Round(rotZ);

        if(roundedRot % 90 != 0){
            transform.rotation = Quaternion.Euler(0f, 0f, rotZ / 20);
        } else {
            var desiredRot = Quaternion.Euler(0f, 0f, 0f);

            transform.rotation = Quaternion.Lerp(transform.rotation, desiredRot, Time.deltaTime * 25);
        }
    }

    void CalculateDirection(){
        if (this.dead) {
            return;
        }
        bool keyLeft = Input.GetKey("left");
        bool keyRight = Input.GetKey("right");
        bool keyUp = Input.GetKey("up");
        bool keyDown = Input.GetKey("down");

        hasInput = false;

        if(keyLeft){
            if(canMoveLeft){
                hasInput = direction != Vector3.left;
                direction = Vector3.left;
                
            }
        } else if(keyRight){
            if(canMoveRight){
                hasInput = direction != Vector3.right;
                direction = Vector3.right;
            }
        } else if(keyUp){
            if(canMoveUp){
                hasInput = direction != Vector3.up;
                direction = Vector3.up;
            }
        } else if(keyDown){
            if(canMoveDown){
                hasInput = direction != Vector3.down;
                direction = Vector3.down;
            }
        }
    }
}
