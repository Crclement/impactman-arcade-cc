using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CameraController : MonoBehaviour
{
    public bool start = false;
    public AnimationCurve curve;
    public float duration = 1f;

    private float magnitude = 1f;

    void Update()
    {
        if(start){
            start = false;
            StartCoroutine(Shaking());
        }
    }

    public void Shake(float duration = 1f, float magnitude = 1f){
        this.magnitude = magnitude;
        this.duration = duration;
        start = true;
    }

    IEnumerator Shaking(){
        Vector3 startPosition = transform.position;
        float elapsedTime = 0f;

        while(elapsedTime < duration) {
            elapsedTime += Time.deltaTime;
            float strength = curve.Evaluate(elapsedTime / duration);
            transform.position = startPosition + Random.insideUnitSphere * strength * 16f * magnitude;
            yield return null;
        }

        transform.position = startPosition;
    }
}
