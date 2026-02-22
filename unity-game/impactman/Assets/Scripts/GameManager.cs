using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;
using DG.Tweening;
using System;
using UnityEngine.SceneManagement;
using Newtonsoft.Json.Linq;

public class WebMessage
{
    public string Action;
    public string SessionId;
}

public class GameManager : MonoBehaviour
{
    public GameObject playerPrefab;
    public GameObject ghost1Prefab;
    public GameObject ghost2Prefab;
    public GameObject ghost3Prefab;
    public GameObject ghost4Prefab;
    public GameObject egg1Prefab;
    public GameObject egg2Prefab;
    public GameObject egg3Prefab;
    public GameObject egg4Prefab;
    public GameObject egg5Prefab;
    public GameObject trashPrefab;

    public GameObject modalUi;

    private GameObject player;
    private List<GameObject> ghosts = new List<GameObject>();

    private int score = 0;
    private int level = 2;
    private int lives = 3;

    private int totalCollectables = 0;
    private int collectedCollectables = 0;
    private int collectedCollectablesTotal = 0;

    private float playerSpeed = .8f;
    private float ghostSpeed = .75f;

    private float pausedTime = 0f;
    private bool paused = false;

    private GameObject endScreenBG;

    public List<GameObject> maps = new List<GameObject>();
    private Tilemap collectablesTilemap = null;
    private Tilemap charactersTilemap = null;

    private Vector3 animalStartPosition;
    private Vector3 animalEndPosition;
    private int animalNumber = 0;

    private GameObject currentAnimal = null;

    public List<GameObject> animals = new List<GameObject>();
    public List<int> animalsThreshold = new List<int>();

    private PlayerController playerController;

    // Start is called before the first frame update
    void Start()
    {
        Application.targetFrameRate = -1;
        UnityEngine.Random.InitState(42);

        GlobalVariables.Set("maximumSpeed", 7.5f);

        endScreenBG = GameObject.Find("EndGameScreen/Background");

        this.level = GlobalVariables.Get<Nullable<int>>("currentLevel") ?? 1;
        this.score = GlobalVariables.Get<Nullable<int>>("currentScore") ?? 0;
        this.lives = GlobalVariables.Get<Nullable<int>>("currentLives") ?? 3;

        GlobalVariables.Set("currentLevel", this.level);
        GlobalVariables.Set("currentScore", this.score);
        GlobalVariables.Set("currentLives", this.lives);
        GlobalVariables.Set("gameScreen", "playing");

        Init();
    }

    void Pause(float time){
        paused = true;
        pausedTime = time;
        player.GetComponent<PlayerController>().Stop();
        foreach(GameObject ghost in ghosts){
            ghost.GetComponent<GhostController>().Stop();
        }
    }

    void Resume(){
        player.GetComponent<PlayerController>().Resume();
        foreach(GameObject ghost in ghosts){
            ghost.GetComponent<GhostController>().Resume();
        }
    }

    public int GetCollactablesLeft(){
        return totalCollectables - collectedCollectables;
    }

    public int GetLevel(){
        return level;
    }

    public void OnWebMessage(string message)
    {
        Debug.Log($"Received message on Unity: {message}");
        WebMessage m = JsonUtility.FromJson<WebMessage>(message);

        switch (m.Action)
        {
            case "playAgain":
                PlayAgain();
                break;
            case "goNextLevel":
                GoNextLevel();
                break;
            case "muteGame":
                AudioListener.volume = 0;
                break;
            case "unmuteGame":
                AudioListener.volume = 1;
                break;
        }
    }

    void GoNextLevel()
    {
        SceneManager.LoadScene("GameScene", LoadSceneMode.Single);
    }

    void PlayAgain()
    {
        GlobalVariables.Set("currentLevel", 1);
        GlobalVariables.Set("currentScore", 0);
        GoToMainScreen();
    }

    void Init(bool skipCoins = false){
        GameObject.Find("GameCanvas/GameOver").GetComponent<TMPro.TextMeshProUGUI>().enabled = false;

        // 0. Display the map based on the level
        LoadMap();

        GameObject.Find("GameCanvas/Ready").GetComponent<TMPro.TextMeshProUGUI>().enabled = true;
        GameObject.Find("GameCanvas/PlayerOne").GetComponent<TMPro.TextMeshProUGUI>().enabled = true;

        if (level == 1) {
            playerSpeed = .8f;
            ghostSpeed = .75f;
        } else if (level > 1 && level < 4){
            playerSpeed = .9f;
            ghostSpeed = .85f;
        } else {
            playerSpeed = 1f;
            ghostSpeed = .95f;
        }

        PlayFX("StartGameFX");

        // 1. Place all the coins in the map
        if (!skipCoins)
        {
            PlaceCoins();
        }

        PlaceCharacters();

        // 3. Start player movement
        Invoke("StartMovement", 3f);
    }

    private void LoadMap()
    {
        int levelArray = (this.level - 1) % this.maps.Count;

        GameObject selectedMap = this.maps[levelArray];

        this.collectablesTilemap = selectedMap.transform.Find("GameGrid/CollectablesMap").GetComponent<Tilemap>();
        this.charactersTilemap = selectedMap.transform.Find("GameGrid/CharactersMap").GetComponent<Tilemap>();

        foreach(GameObject map in maps)
        {
            map.SetActive(map == selectedMap);
        }
    }

    void AddScore(int value){
        this.score += value;
        GlobalVariables.Set("currentScore", score);

        int bags = GlobalVariables.Get<int>("currentBags");

        if (score % 100 == 0)
        {
            GlobalVariables.Set("currentBags", bags + 1);
        }
    }

    void OnCollectableCollected(int value){
        AddScore(value);

        collectedCollectables++;
        collectedCollectablesTotal++;

        Debug.Log($"Total {totalCollectables} - Collected {collectedCollectables}");

        if(collectedCollectables == totalCollectables){
            Debug.Log("You win!");
            LevelWin();
        }
    }

    void PlayFX(string fxName){
        GameObject.Find("SFX/" + fxName).GetComponent<AudioSource>().Stop();
        GameObject.Find("SFX/" + fxName).GetComponent<AudioSource>().Play();
    }

    void PlayCountFX(){
        PlayFX("CountFX");
    }

    void CollectableCollected(){
        PlayFX("CollectableFX");
    }

    void OnAnimalCollected(int points)
    {
        AddScore(points);
        PlayFX("EnemyKillFX");
        currentAnimal = null;
    }

    void OnGhostsStartScatter(){
        transform.Find("Song").GetComponent<AudioSource>().pitch = 1;
    }

    void StopSong(){
        transform.Find("Song").GetComponent<AudioSource>().volume = 0f;
    }

    void StartSong(){
        transform.Find("Song").GetComponent<AudioSource>().volume = 0.5f;
    }

    void StartPowerUp(){
        Debug.Log("Egg collected!");
        GlobalVariables.Set("gameScreen", "playing");
        CancelInvoke("StopEggPowerUp");
        foreach(GameObject ghost in ghosts){
            ghost.GetComponent<GhostController>().StartFrightened();
        }
        StopSong();
        
        PlayFX("EggTimerFX");
        Invoke("HideModal", 2f);

        Invoke("StopEggPowerUp", 6f);
    }

    void EggCollected(){
        PlayFX("EggPickFX");
        ShowModal();
        Pause(2.1f);
        Invoke("HideModal", 2f);
        Invoke("StartPowerUp", 2f);

        GlobalVariables.Set("gameScreen", "egg");

        int bags = GlobalVariables.Get<int>("currentBags");

        // Random between 6 and 12
        int eggBags = UnityEngine.Random.Range(6, 13);

        GlobalVariables.Set("currentBags", bags + eggBags);
        GlobalVariables.Set("eggBags", eggBags);
    }

    void ShowModal(){
        modalUi.SetActive(true);
    }

    void HideModal(){
        modalUi.SetActive(false);
    }

    void StopEggPowerUp(){
        StartSong();
        foreach(GameObject ghost in ghosts){
            ghost.GetComponent<GhostController>().StopFrightened();
        }
        transform.Find("Song").GetComponent<AudioSource>().volume = 1f;
    }

    void GameOver() {
        this.lives -= 1;
        GlobalVariables.Set("currentLives", this.lives);

        StopSong();
        PlayFX("KilledFX");
        GameObject.Find("Camera").GetComponent<CameraController>().Shake();
        GameObject.Find("GameCanvas/GameOver").GetComponent<TMPro.TextMeshProUGUI>().enabled = true;

        Invoke("StopGhosts", 0.1f);

        if(this.lives > 0)
        {
            Invoke("Retry", 2f);
        } else
        {
            Invoke("ShowEndScreen", 2f);
        }
    }

    void Retry ()
    {
        foreach (GameObject ghost in ghosts)
        {
            Destroy(ghost);
        }
        this.ghosts = new List<GameObject>();
        Destroy(player);
        this.DestroyAnimal();

        Init(true);
    }

    void StopPlayer(){
        player.GetComponent<PlayerController>().Stop();
    }

    void StopGhosts(){
        foreach(GameObject ghost in ghosts){
            ghost.GetComponent<GhostController>().Stop();
        }
    }

    void GoToMainScreen(){
        UnityEngine.SceneManagement.SceneManager.LoadScene("StartScene", UnityEngine.SceneManagement.LoadSceneMode.Single);
    }

    void EnemyKilled(){
        Pause(0.3f);
        GameObject.Find("Camera").GetComponent<CameraController>().Shake(0.3f, 0.3f);
        AddScore(100);
        PlayFX("EnemyKillFX");
    }

    void LevelWin(){
        StopSong();
        GlobalVariables.Set("currentLevel", this.level + 1);
        

        PlayFX("LevelWinFX");
        foreach(GameObject ghost in ghosts){
            Destroy(ghost, 0);
        }

        ghosts = new List<GameObject>();
        collectedCollectables = 0;
        totalCollectables = 0;

        player.GetComponent<PlayerController>().Stop();

        ShowNextLevelScreen();
    }

    void ShowDarkOverlay ()
    {
        endScreenBG.GetComponent<SpriteRenderer>().DOColor(new Color(0, 0, 0, 0.8f), 0.3f);
    }

    void HideDarkOverlay ()
    {
        endScreenBG.GetComponent<SpriteRenderer>().DOColor(new Color(0, 0, 0, 0), 0.3f);
    }

    void ShowNextLevelScreen()
    {
        ShowDarkOverlay();

        GlobalVariables.Set("gameScreen", "win");
    }

    void ShowEndScreen(){
        ShowDarkOverlay();

        GlobalVariables.Set("gameScreen", "gameover");
    }

    void Restart(){
        GoToMainScreen();
    }

    public void NewLevel(){
        level += 1;
        Destroy(player,0);
        Init();

        GameObject.Find("GameCanvas/Level").GetComponent<TMPro.TextMeshProUGUI>().text = "Level " + level.ToString();
    }

    void GhostEyesFX(){
        PlayFX("GhostEyesFX");
    }

    void StartMovement(){
        Debug.Log("Start movement");
        StartSong();
        GameObject.Find("GameCanvas/Ready").GetComponent<TMPro.TextMeshProUGUI>().enabled = false;

        // Start Player Movement
        player.GetComponent<PlayerController>().Init(this.playerSpeed);


        Vector3[] scatterPositions = new Vector3[4] {
            GridHelper.GetPosition(0, 0),
            GridHelper.GetPosition(0, 28),
            GridHelper.GetPosition(25, 0),
            GridHelper.GetPosition(25, 28)
        };


        for (int i = 0; i < ghosts.Count; i++)
        {
            ghosts[i].GetComponent<GhostController>().Init(scatterPositions[i], i);
        }
    }

    void CreateInstance(TileBase tile, Vector3 position){
        float ghostInitialSpeed = ghostSpeed * GlobalVariables.Get<float>("maximumSpeed");


        if (tile.name == "TrashTile"){
            Spawn(trashPrefab, position);

            totalCollectables++;
        }
        else if(tile.name == "Egg1Tile"){
            Spawn(egg1Prefab, position);

            totalCollectables++;
        }
        else if(tile.name == "Egg2Tile"){
            Spawn(egg2Prefab, position);

            totalCollectables++;
        }
        else if(tile.name == "Egg3Tile"){
            Spawn(egg3Prefab, position);

            totalCollectables++;
        }
        else if(tile.name == "Egg4Tile"){
            Spawn(egg4Prefab, position);

            totalCollectables++;
        }
        else if(tile.name == "Egg5Tile"){
            Spawn(egg5Prefab, position);

            totalCollectables++;
        }
        else if (tile.name == "AnimalStart")
        {
            animalStartPosition = position;
        }
        else if (tile.name == "AnimalEnd")
        {
            animalEndPosition = position;
        }
        else if(tile.name == "Ghost1Tile"){
            GameObject ghost = Spawn(ghost1Prefab, position);

            ghost.GetComponent<GhostController>().SetGhost(ghostInitialSpeed, 20);

            ghosts.Add(ghost);
        } else if(tile.name == "Ghost2Tile") {
            GameObject ghost = Spawn(ghost2Prefab, position);

            ghost.GetComponent<GhostController>().SetGhost(ghostInitialSpeed, -20);

            ghosts.Add(ghost);
        } else if(tile.name == "Ghost3Tile") {
            GameObject ghost = Spawn(ghost3Prefab, position);

            ghost.GetComponent<GhostController>().SetGhost(ghostInitialSpeed, 0, level > 1);

            ghosts.Add(ghost);
        } else if(tile.name == "Ghost4Tile") {
            GameObject ghost = Spawn(ghost4Prefab, position);

            ghost.GetComponent<GhostController>().SetGhost(ghostInitialSpeed, 4);

            ghosts.Add(ghost);
        } else if(tile.name == "PlayerTile") {
            Debug.Log("Placing player");
            player = Spawn(playerPrefab, position);

            playerController = player.GetComponent<PlayerController>();
        }
        else if(tile.name == "Boat"){
            player = Spawn(playerPrefab, position);
        } else{
            Debug.Log($"Tile {tile.name} not found");
        }
    }

    GameObject Spawn(GameObject prefab, Vector3 cellPosition){
        return Instantiate(prefab, cellPosition + new Vector3(16,16,0), Quaternion.identity, transform);
    }

    void PlaceCoins(){
        Debug.Log("Placing coins");
        foreach (Vector3Int position in collectablesTilemap.cellBounds.allPositionsWithin){
            GridLayout gridLayout = collectablesTilemap.GetComponentInParent<GridLayout>();
            Vector3 cellPosition = gridLayout.CellToWorld(position);

            TileBase tile = collectablesTilemap.GetTile(position);            
            

            if(tile != null){
                CreateInstance(tile, cellPosition);
            }
        }

        collectablesTilemap.gameObject.GetComponent<TilemapRenderer>().enabled = false;
    }

    void PlaceCharacters(){
        Debug.Log("Placing characters");
        foreach (Vector3Int position in charactersTilemap.cellBounds.allPositionsWithin){
            GridLayout gridLayout = charactersTilemap.GetComponentInParent<GridLayout>();
            Vector3 cellPosition = gridLayout.CellToWorld(position);

            TileBase tile = charactersTilemap.GetTile(position);            

            if(tile != null){
                CreateInstance(tile, cellPosition);
                // DrawBox(cellPosition, Color.red);
            }
        }

        charactersTilemap.gameObject.GetComponent<TilemapRenderer>().enabled = false;
        GameObject.Find("GameCanvas/PlayerOne").GetComponent<TMPro.TextMeshProUGUI>().enabled = false;
    }

    public Vector3 GetPlayerPosition(){
        return playerController.movePoint.position;
    }

    public Vector3 GetPlayerDirection()
    {
        return playerController.movingDirection;
    }

    // Update is called once per frame
    void Update()
    {
        float newPausedTime = pausedTime - Time.deltaTime;

        if(newPausedTime > 0){
            pausedTime = newPausedTime;
        } else{
            pausedTime = 0;

            if(paused){
                paused = false;
                Resume();
            }
        }

        AnimalHandler();
    }

    void AnimalHandler()
    {
        if(currentAnimal != null)
        {
            return;
        }

        /* Cycle animals */
        if (this.animalNumber > this.animals.Count - 1)
        {
            collectedCollectablesTotal = 0;
            this.animalNumber = 0;
            return;
        }

        if (collectedCollectablesTotal > animalsThreshold[animalNumber])
        {
            Debug.Log("Spawning animal");
            GameObject animal = Spawn(animals[animalNumber], animalStartPosition);
            currentAnimal = animal;
            animal.transform.Find("Animal").GetComponent<AnimalController>().targetPosition = animalEndPosition + new Vector3(16, 16, 0); ;
            this.animalNumber += 1;
            

            Debug.Log($"Animal Number?????? {this.animalNumber}");
        }
    }

    public void DestroyAnimal()
    {
        if(currentAnimal != null)
        {
            Destroy(this.currentAnimal);
            currentAnimal = null;
        }
    }
}
