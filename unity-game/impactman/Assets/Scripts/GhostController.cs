using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

enum GhostState
{
    Starting,
    Chase,
    Scatter,
    Frightened,
    Dead,
    Debug
}

public class GhostController : MonoBehaviour
{
    public Transform movePoint;
    private float speed = 6f;

    public AnimationClip spriteUp;
    public AnimationClip spriteDown;
    public AnimationClip spriteLeft;
    public AnimationClip spriteRight;

    public AnimationClip spriteVulUp;
    public AnimationClip spriteVulDown;
    public AnimationClip spriteVulLeft;
    public AnimationClip spriteVulRight;

    public AnimationClip spriteEyesUp;
    public AnimationClip spriteEyesDown;
    public AnimationClip spriteEyesLeft;
    public AnimationClip spriteEyesRight;

    private float startingWait = 4f;
    private float totalStartingWaited = 0f;

    private Vector3 direction = Vector3.up;

    private Vector3 debugTarget;

    private bool shouldBeMoving = false;

    private GhostState state = GhostState.Starting;
    private GameObject gameManager;
    private GameManager gameManagerScript;

    private Vector3 initialPosition;
    private Vector3 currentDirection = Vector3.zero;

    private Vector3 scatterPosition;

    private Tilemap walkPathTilemap;

    private int targetOffset;

    // private bool debug = true;

    private bool berserkerMode = false;
    private bool enableBerserkerMode = false;

    private float scatterDuration = 7f;
    private float chaseDuration = 12f;
    // private float frightenedDuration = 5f;

    private int maxScatterCycles = 4;
    private float scatterCycles = 0;


    protected Animator animator;
    protected AnimatorOverrideController animatorOverrideController;

    public void SetGhost(float s, int t, bool enableBerserkerMode = false){
        targetOffset = t;
        speed = s;

        this.enableBerserkerMode = enableBerserkerMode;
    }

    public bool CanBeKilled(){
        return state == GhostState.Frightened;
    }

    float GetGhostSpeed(){
        float multiplier = 1f;

        if(state.Equals(GhostState.Frightened)){
            multiplier = 0.5f;
        }

        if(berserkerMode){
            return speed * 1.1f * multiplier;
        } else {
            return speed * multiplier;
        }
    }

    public void MoveTo(Vector3 position)
    {
        this.direction = this.direction * -1;

        movePoint.transform.position = position;
        transform.position = position - (direction * 16);
    }

    // Start is called before the first frame update
    void Start()
    {
        gameManager = GameObject.Find("GameManager");
        gameManagerScript = gameManager.GetComponent<GameManager>();
        movePoint.parent = null;
        
        animator = GetComponent<Animator>();
        animatorOverrideController = new AnimatorOverrideController(animator.runtimeAnimatorController);
        animator.runtimeAnimatorController = animatorOverrideController;

        SetSprite();

        string currentMap = $"Maps/Map{GlobalVariables.Get<int>("currentLevel")}/WallGrid/WalkPath";

        Debug.Log($"current {currentMap}");
        walkPathTilemap = GameObject.Find(currentMap).GetComponent<Tilemap>();
    }

    void SetSprite(){
        AnimationClipOverrides clipOverrides = new AnimationClipOverrides(animatorOverrideController.overridesCount);
        animatorOverrideController.GetOverrides(clipOverrides);

        AnimationClip up = spriteUp;
        AnimationClip down = spriteDown;
        AnimationClip left = spriteLeft;
        AnimationClip right = spriteRight;

        if(state == GhostState.Frightened){
            up = spriteVulUp;
            down = spriteVulDown;
            left = spriteVulLeft;
            right = spriteVulRight;
        } else if(state == GhostState.Dead){
            up = spriteEyesUp;
            down = spriteEyesDown;
            left = spriteEyesLeft;
            right = spriteEyesRight;
        }

        foreach(AnimationClip clip in animatorOverrideController.animationClips){
            clipOverrides["Ghost1Up"] = up;
            clipOverrides["Ghost1Down"] = down;
            clipOverrides["Ghost1Left"] = left;
            clipOverrides["Ghost1Right"] = right;
        }
        animatorOverrideController.ApplyOverrides(clipOverrides);
    }

    void HandleMovement(){
        transform.position = Vector3.MoveTowards(transform.position, movePoint.transform.position, Time.deltaTime * 32 * GetGhostSpeed());
    }

    public void Init(Vector3 initialScatter, int index){
        debugTarget = initialScatter;
        scatterPosition = initialScatter;
        shouldBeMoving = true;
        currentDirection = Vector3.zero;
        initialPosition = new Vector3(movePoint.transform.position.x, movePoint.transform.position.y, 0);
        GetComponent<Animator>().enabled = true;

        int level = gameManagerScript.GetLevel();

        if (index == 1)
        {
            this.startingWait = 0;
        } else if (index == 2)
        {
            this.startingWait = 1.5f;
        } else if (index == 3 || index == 0)
        {
            this.startingWait = 3f;
        }

        if(level == 1){
            scatterDuration = 5f;
            chaseDuration = 12f;
            maxScatterCycles = 6;
        } else if (level > 1 && level < 4){
            scatterDuration = 5f;
            chaseDuration = 20f;
            maxScatterCycles = 4;
        } else {
            scatterDuration = 5f;
            chaseDuration = 20f;
            maxScatterCycles = 2;
        }

        Debug.Log($"Ghost speed: {speed}");
    }

    public void Resume(){
        shouldBeMoving = true;
        GetComponent<Animator>().enabled = true;
    }

    public void Stop(){
        shouldBeMoving = false;
        GetComponent<Animator>().enabled = false;
    }

    void FixedUpdate() {
        if(!shouldBeMoving && !state.Equals(GhostState.Dead))
        {
            return;
        }
        HandleMovement();
        HandleMovePoint();
    }

    // Update is called once per frame
    void Update()
    {
        if (state.Equals(GhostState.Debug))
        {
            HandleDebugPointer();
        }
        HandleBerserkerMode();
    }

    void HandleBerserkerMode(){
        if(enableBerserkerMode && gameManagerScript.GetCollactablesLeft() <= 20){
            berserkerMode = true;
        }
    }

    List<Vector3> GetPossibleDirection(Vector3 point){
        // Fix Z issue
        point.z = 0;

        bool canMoveLeft = CheckColission(point, Vector3.left);
        bool canMoveRight = CheckColission(point, Vector3.right);
        bool canMoveUp = CheckColission(point, Vector3.up);
        bool canMoveDown = CheckColission(point, Vector3.down);

        List<Vector3> possibleDirections = new List<Vector3>();
        
        if (canMoveRight){
            possibleDirections.Add(Vector3.right);
        }
        if (canMoveLeft)
        {
            possibleDirections.Add(Vector3.left);
        }
        if (canMoveDown)
        {
            possibleDirections.Add(Vector3.down);
        }
        if (canMoveUp)
        {
            possibleDirections.Add(Vector3.up);
        }

        return possibleDirections;
    }

    void HandleMovePoint(){
        if(Vector3.Distance(transform.position, movePoint.transform.position) <= 1f){
            Vector3 direction = Vector3.zero;

            if (state == GhostState.Starting)
            {
                direction = MoveStarting();
            } else if (state == GhostState.Chase){
                direction = MoveChase();
            } else if(state == GhostState.Scatter){
                direction = MoveScatter();
            } else if(state == GhostState.Frightened){
                direction = MoveFrightened();
            } else if(state == GhostState.Dead){
                direction = MoveDead();
            } else if(state == GhostState.Debug){
                direction = MoveDebug();
            }

            if(direction != Vector3.zero){
                currentDirection = direction;
                movePoint.transform.position += direction * 32;

                if(direction == Vector3.up){
                    GetComponent<Animator>().SetInteger("direction", 1);
                } else if(direction == Vector3.right){
                    GetComponent<Animator>().SetInteger("direction", 2);
                } else if(direction == Vector3.down){
                    GetComponent<Animator>().SetInteger("direction", 3);
                } else if(direction == Vector3.left){
                    GetComponent<Animator>().SetInteger("direction", 0);
                }
            }
        }
    }

    void HandleDebugPointer()
    {
        if (Input.GetMouseButtonDown(0))
        {
            var worldPoint = Camera.main.ScreenToWorldPoint(Input.mousePosition);

            Vector3 tpos = (walkPathTilemap.WorldToCell(worldPoint) * 32) + new Vector3(16, 32);

            Debug.Log($"Debug click: {tpos}");
            GridHelper.DrawBox(tpos, Color.yellow, 1);
            debugTarget = tpos;
        }
    }

    Vector3 MoveDebug(){
        return DirectionTo(movePoint.transform.position, debugTarget);
    }

    public void StartStarting(float wait)
    {
        state = GhostState.Starting;
        currentDirection = Vector3.zero;
        direction = Vector3.zero;

        startingWait = wait;
    }

    public void StartChase(){
        if(CanChangeState()){
            currentDirection = currentDirection * -1;
        }

        state = GhostState.Chase;
        SetSprite();

        if(scatterCycles <= maxScatterCycles){
            Invoke("StartScatter", chaseDuration);
        }
    }

    public void StopFrightened(){
        if(state == GhostState.Dead){
            return;
        }
        
        StartScatter();
    }

    public void StartScatter(bool forceScatter = false){
        if(scatterCycles >= maxScatterCycles && !forceScatter){
            StartChase();
            return;
        }

        if(CanChangeState()){
            currentDirection = currentDirection * -1;
        }
        
        state = GhostState.Scatter;
        SetSprite();

        Invoke("StartChase", scatterDuration);

        scatterCycles += 1;
    }

    public void StartFrightened(){
        if(state == GhostState.Dead){
            return;
        }

        state = GhostState.Frightened;
        SetSprite();
        currentDirection = currentDirection * -1;

        CancelInvoke();
    }

    public void StartDead(){
        state = GhostState.Dead;
        SetSprite();
        currentDirection = currentDirection * -1;

        CancelInvoke();

        GetComponent<Collider2D>().enabled = false;

        GetComponent<Animator>().SetBool("dead", true);
    }

    bool CanChangeState(){
        return state != GhostState.Frightened && state != GhostState.Dead;
    }

    Vector3 MoveDead(){
        float distance = Vector3.Distance(movePoint.transform.position, initialPosition);

        if(distance <= 32){
            SetSprite();
            GetComponent<Collider2D>().enabled = true;
            GetComponent<Animator>().SetInteger("direction", 1);

            StartStarting(0);

            Debug.Log("Ghost is starting");
            return currentDirection;
        }

        SendMessageUpwards("GhostEyesFX");
        return DirectionTo(movePoint.transform.position, initialPosition);
    }

    Vector3 MoveScatter(){
        return DirectionTo(movePoint.transform.position, scatterPosition);
    }

    Vector3 DirectionTo(Vector3 from, Vector3 destination) {
        // Fix Z issue
        from.z = 0;
        destination.z = 0;

        // Initialize both open and closed list
        Dictionary<Vector3, PathNode> opens = new Dictionary<Vector3, PathNode>();
        Dictionary<Vector3, PathNode> closed = new Dictionary<Vector3, PathNode>();

        // Add the start node
        opens.Add(from, new PathNode(from, 0, null));

        GridHelper.DrawBox(destination, Color.magenta, .5f);

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

            foreach(KeyValuePair<Vector3, PathNode> open in opens)
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

            // Found the destination
            if (selectedNode.position == destination)
            {
                while (selectedNode.parent != null && selectedNode.parent.position != from) {
                    // GridHelper.DrawBox(selectedNode.position, Color.green, 1);

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

                if(possibleDirections.Count == 0)
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

        // If it's on tunnel
        List<Vector3> directions = GetPossibleDirection(from);

        if (directions.Contains(currentDirection))
        {
            return currentDirection;
        }

        return currentDirection;
    }

    Vector3 MoveStarting()
    {
        this.totalStartingWaited += Time.deltaTime;

        if (this.totalStartingWaited > this.startingWait)
        {
            this.totalStartingWaited = 0;
            StartScatter();
        }

        if (currentDirection == null)
        {
            List<Vector3> directions = GetPossibleDirection(initialPosition);

            // Get random direction
            currentDirection = directions[Random.Range(0, directions.Count)];
        }

        return currentDirection * -1;
    }

    Vector3 MoveChase(){
        Vector3 playerPosition = gameManagerScript.GetPlayerPosition();
        Vector3 playerDirection = gameManagerScript.GetPlayerDirection();
        Vector3 target = playerPosition;

        Vector3 lastDirection = Vector3.zero;

        int offset = Mathf.Abs(targetOffset);

        // Choose a random offset
        for(int i = 0; i < offset; i++)
        {
            // Calculate offset direction
            if (i == 0)
            {
                target += playerDirection * (targetOffset > 0 ? 32 : -32);
            }

            List<Vector3> possibleDirections = GetPossibleDirection(target);

            Vector3 dir = possibleDirections.Contains(lastDirection) ? lastDirection : possibleDirections[Random.Range(0, possibleDirections.Count)];

            lastDirection = dir;
            target += dir * 32;
        }

        return DirectionTo(movePoint.transform.position, target);
    }

    Vector3 MoveFrightened(){
        List<Vector3> possibleDirections = GetPossibleDirection(movePoint.transform.position);
        Vector3 direction = Vector3.zero;

        if(possibleDirections.Count > 0){
            direction = possibleDirections[Random.Range(0, possibleDirections.Count)];
        }

        return direction;
    }

    bool CheckColission(Vector3 from, Vector3 dir) {
        LayerMask mask = LayerMask.GetMask("Wall");
        RaycastHit2D hit = Physics2D.Raycast(from - new Vector3(8,8,0), dir, 32, mask); 

        if(hit.collider != null){
            return true;
        }

        return false;
    }

    Vector3 GetMovePointPosition()
    {
        return movePoint.transform.position - new Vector3(16, 16, 0);
    }
}
