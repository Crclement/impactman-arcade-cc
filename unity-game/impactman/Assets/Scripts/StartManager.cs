using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;


public class StartManager : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {
        GlobalVariables.Set("currentLevel", 1);
        GlobalVariables.Set("currentScore", 0);
        GlobalVariables.Set("currentLives", 3);
        GlobalVariables.Set("currentBags", 0);
        GlobalVariables.Set("gameScreen", "menu");
        Physics.IgnoreLayerCollision(0,7);
    }

    void LoadGame ()
    {
        SceneManager.LoadScene("GameScene", LoadSceneMode.Single);
    }

    void LoadLevelSelector ()
    {
        SceneManager.LoadScene("LevelSelector", LoadSceneMode.Single);
    }
}
