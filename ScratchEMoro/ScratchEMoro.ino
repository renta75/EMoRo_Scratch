#include <StringSplitter.h>


void setup() {
  Serial.begin(9600);
  EmoroServo.attach(SERVO_0);  //Initiates servo on SERVO_0 port.
  Serial.println("Initialisation");
}

String command="";
void loop() {
    while (Serial1.available() > 0) {
  
        char currChar=(char) Serial1.read();
        
        if(currChar!='\n')
        {
          command=command+currChar;
          
        }
        else
        {
          process_command(command);
          command="";
        }
    }
}

void process_command(String command)
{
  StringSplitter *splitter = new StringSplitter(command, ',',10);
  if (command.startsWith("write_io"))
  {
    StringSplitter *splitterIO = new StringSplitter(splitter->getItemAtIndex(1), '_',10);
    digitalWrite(IO_0+splitterIO->getItemAtIndex(1).toInt(),splitter->getItemAtIndex(2).toInt() ); 
  }
  if (command.startsWith("read_io"))
  {
    StringSplitter *splitterIO = new StringSplitter(splitter->getItemAtIndex(1), '_',10);
    Serial1.println(digitalRead(IO_0+splitterIO->getItemAtIndex(1).toInt()));  
  }
  if (command.startsWith("read_adc"))
  {
    StringSplitter *splitterADC = new StringSplitter(splitter->getItemAtIndex(1), '_',10);
    Serial1.println(analogRead(ADC_0+splitterADC->getItemAtIndex(1).toInt()));  
  }
  else if (command.startsWith("display"))
  {
    Lcd.print(splitter->getItemAtIndex(1));
  }
  else if (command.startsWith("cursor"))
  {
    
    Lcd.locate(splitter->getItemAtIndex(1).toInt(),splitter->getItemAtIndex(2).toInt());
  }  
  else if (command.startsWith("servo"))
  {
    StringSplitter *splitterSERVO = new StringSplitter(splitter->getItemAtIndex(1), '_',10);
    EmoroServo.write(SERVO_0+splitterSERVO->getItemAtIndex(1).toInt(),splitter->getItemAtIndex(2).toInt());
    
  }
  else if (command.startsWith("temperature"))
  {
    Serial1.println("200.00");  
  }
  else if (command.startsWith("compass"))
  {
    char buf[32];                                                 
    int direction = Mag.readDirection();
    sprintf(buf, "%4d", direction);
    Serial1.println(buf);    
  }
  else if (command.startsWith("gyroscope_init"))
  {
    char buf[32];                                                 
    int direction = Mag.readDirection();
    sprintf(buf, "%4d", direction);
    Serial1.println(buf);    
  }
  else if (command.startsWith("gyroscope_reset"))
  {
    Gyr.resetDegrees();    
  }
  else if (command.startsWith("gyroscope"))
  {
    double x_deg, y_deg, z_deg;
    char buf[64];
    int res;
  
    res = Gyr.readDegrees(&x_deg, &y_deg, &z_deg);
  
    if(res == 0){
      // print current positions:
      sprintf(buf, "Current position: X =%3d, Y =%3d, Z =%3d", (int)x_deg, (int)y_deg, (int)z_deg);
      Serial1.println(buf);                                              // print buffer string
    }
    else
    {
      Serial1.println("Can't read angular position.");                   // print constant string  
    }
  }
  else if (command.startsWith("acceleration"))
  {
    // the second complements of each direction, -512 to +511 (corresponding to -2.000g  to 1.996g)
    int x, y, z, res;                                           // initialize variables
    // acceleration in m/s^2 in each direction
    float x_phy, y_phy, z_phy;                                  // initialize variables
    // string form of acceleration in m/s^2
    char x_phyStr[10], y_phyStr[10], z_phyStr[10];              // initialize variables
  
    // read the second complements of acceleration in each direction (x, y, z)
    // x -> right, -x -> left
    // y -> backward, -y -> forward
    // -z -> to the eart, z -> to up above 
    res = Acc.read(&x, &y, &z);                                 // read the second complements of acceleration in each direction (x, y, z)
     
     
    if(res == 0){                                               // if reading successfull
      // convert to physical acceleration values (m/s^2)
      x_phy=x*2.0*9.81/512;
      y_phy=y*2.0*9.81/512;
      z_phy=z*2.0*9.81/512;
  
      char buf[32];                                              // initialize variables
      sprintf(buf, "X =%4d, Y =%4d, Z =%4d", x, y, z);          // form a result string
      Serial1.println(buf);                                      // print buf string
    }
    else
    {
      Serial1.println("Can't read acceleration.");                   // print constant string  
    }
  }
}


/************************************************************************************************************/
/*                                              end of file                                                 */
/************************************************************************************************************/
