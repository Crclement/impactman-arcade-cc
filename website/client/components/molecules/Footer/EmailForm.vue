<template>
<div class="form__group">
  <input type="email" class="form__field" placeholder="Email" name="email" id='email' required />
  <label for="email" class="form__label uppercase">Enter Email</label>
  <img src="/images/homepage/footer/email-form__arrow.svg" class="form-field__icon"/>
</div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
$primary: #11998e
$secondary: #38ef7d
$white: #fff
$gray: #9b9b9b
.form__group
  position: relative
  padding: 15px 0 0
  margin-top: 10px
  @screen xl
    margin-top: 0px

.form__field
  font-family: inherit
  width: 100%
  border: 0
  border-bottom: 2px solid #16114F
  outline: 0
  font-size: 1.3rem
  color: #DFFF80
  padding: 7px 0 5px 0
  background: transparent
  transition: border-color 0.2s

  &::placeholder
    color: transparent

.form-field__icon
  position: absolute
  bottom: 9px
  right: 0

  &:placeholder-shown ~ .form__label
    font-size: 1.3rem
    cursor: text
    top: 35px
    @screen xl
      top: 0px


.form__label
  position: absolute
  top: 30px
  display: block
  transition: 0.2s
  font-size: 22px
  color: #16114F
  @screen xl
    top: 0
    font-size: 22px


.form__field:focus
  ~ .form__label
    position: absolute
    top: 0
    display: block
    transition: 0.2s
    font-size: 1rem
    color: #16114F
    opacity: 0.5
    font-weight:700

  font-weight: 700
  border-color: #16114F
  border-image-slice: 1

/* reset input */
.form__field
  &:required,&:invalid
    box-shadow: none
</style>