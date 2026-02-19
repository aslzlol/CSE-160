class Camera {
  constructor() {
    //this.type = 'camera';
    this.fov = 60;
    this.eye = new Vector3([15, 0.3, 10]);
    this.at = new Vector3([0, 0.3, 0]);
    this.up = new Vector3([0, 1, 0]);
    this.f = new Vector3([0, 0, 0]);
    
    this.viewMatrix = new Matrix4();
    this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                              this.at.elements[0], this.at.elements[1], this.at.elements[2],
                              this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
    
  }

  updateViewMatrix() {
    if(this.at.elements[1] < 0.3){
        this.at.elements[1] = 0.3;
    }
    if(this.eye.elements[1] < 0.3){
        this.eye.elements[1] = 0.3;
    }
    this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                              this.at.elements[0], this.at.elements[1], this.at.elements[2],
                              this.up.elements[0], this.up.elements[1], this.up.elements[2]);
  }

  updateProjectionMatrix() {
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
  }
  
  moveForward(speed = 0.1) {
    // var f = this.at.sub(this.eye);
    // f=f.div(f.magnitude());
    // this.at = this.at.add(f.mul(speed));
    // this.eye = this.eye.add(f.mul(speed));
    // this.updateViewMatrix();

    //var f = this.f;
    this.f.set(this.at);
    this.f.sub(this.eye);
    this.f.normalize();
    this.f.mul(speed);
    this.eye.add(this.f);
    this.at.add(this.f);
    this.updateViewMatrix();
  }
  
  moveBackwards(speed = 0.1) {

    let b = this.f;
    b.set(this.eye);
    //b.set(this.eye);
    b.sub(this.at);
    b.normalize();
    b.mul(speed);
    
    this.eye.add(b);
    this.at.add(b);
    this.updateViewMatrix();
  }
  
  moveLeft(speed = 0.1) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }
  
  moveRight(speed = 0.1) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);
    
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }
  
  panLeft(alpha = 1) {
    let f = this.f;
    f.set(this.at);
    f.sub(this.eye);
    
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    let f_prime = rotationMatrix.multiplyVector3(f);
    
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateViewMatrix();
  }
  
  panRight(alpha = 1) {
    let f = this.f;
    f.set(this.at);
    f.sub(this.eye);
    
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(-alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    let f_prime = rotationMatrix.multiplyVector3(f);
    
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateViewMatrix();
  }

  panUp(alpha = 1) {
    let f = this.f;
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    let s = Vector3.cross(f, this.up);
    s.normalize();

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, s.elements[0], s.elements[1], s.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateViewMatrix();
  }

  panDown(alpha = 1) {
    let f = this.f;
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    let s = Vector3.cross(f, this.up);
    s.normalize();

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(-alpha, s.elements[0], s.elements[1], s.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateViewMatrix();
  }

  Block() {
    let f = this.f;
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    let x = this.eye.elements[0] + f.elements[0]*2;
    let y = this.at.elements[1];
    let z = this.eye.elements[2] + f.elements[2]*2;

    // x += 5;
    // z += 3;

    let mapX = Math.round(x);
    let mapZ = Math.round(z);
    
    mapX +=5;
    mapZ +=3;

    if (mapX < 1 || mapX > 30 || mapZ < 1 || mapZ > 30) {
        return;
    }
     
    if(worldMap[mapZ][mapX] != 0  && (y < 1 && y > -1)){
            worldMap[mapZ][mapX] = 0;
        } else if(y < 1 && y > -1){
            worldMap[mapZ][mapX] = 1;
        }
  }
}