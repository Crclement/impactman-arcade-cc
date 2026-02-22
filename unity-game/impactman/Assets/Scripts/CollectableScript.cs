using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CollectableScript : MonoBehaviour
{
    public int points = 4;
    public float animationDuration = 2f;
    public bool isEgg = false;
    public bool isAnimal = false;

    private bool alive = true;

    public void Start(){
        Animator animator = GetComponent<Animator>();
    }

    public void Collect(){ 
        if(alive){
            alive = false;
            Animator animator = GetComponent<Animator>();
            if (isEgg){
                SendMessageUpwards("EggCollected");
                SendMessageUpwards("OnCollectableCollected", points);
            }
            else if (isAnimal) {
                SendMessageUpwards("OnAnimalCollected", points);
            }
            else {
                SendMessageUpwards("CollectableCollected");
                SendMessageUpwards("OnCollectableCollected", points);

            }

            Destroy(gameObject, animationDuration);
        }
    }
}
