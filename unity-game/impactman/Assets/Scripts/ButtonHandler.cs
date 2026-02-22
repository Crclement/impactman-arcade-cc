using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class ButtonHandler : MonoBehaviour
{
    public Button[] buttons;

    public void StartLevel(int level)
    {
        Debug.Log($"Clicked btn level {level}");
        GlobalVariables.Set("currentLevel", level);
        SceneManager.LoadScene("GameScene", LoadSceneMode.Single);
    }
}
