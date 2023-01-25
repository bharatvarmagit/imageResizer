import { useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Spinner from 'react-bootstrap/Spinner';
import './App.css';
import { Button } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { base64StringToBlob } from 'blob-util';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading,setLoading] = useState(false)
  const [outputImage,setOutputImage] = useState(null)
  const [resizeWidth,setResizeWidth] = useState('')
  const [resizeHeight,setResizeHeight] = useState('')
  const inputCanvas = useRef()
  const outputCanvas=useRef()


  const convertBase64 = file => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file)
      fileReader.onload = () => {
        resolve(fileReader.result);
      }
      fileReader.onerror = (error) => {
        reject(error);
      }
    })
  }




  return (
    <div className="App">
      <h2 style={{color:'charcoal',marginBottom:20,marginTop:10}}>Resize Images</h2>
      <label htmlFor='imageInput' className="imageUploadBtn">Choose Image</label>
       <input
          id='imageInput'
          type="file"
          name="myImage"
          accept='image/*'
          placeholder='Choose Image'
          style={{display:'none'}}
          onChange={(event) => {
            try {
              let image=event.target.files[0];
              console.log(event.target.files[0])
              image.url=URL.createObjectURL(image)
              const context = inputCanvas.current.getContext('2d');
              const img =new Image()
              img.src=image.url

              img.onload = function(){

                image.width =img.width
                image.height=img.height
                image.ratio=img.width/img.height
                const hRatio = 400/img.width
                const vRatio = 400/img.height
                const ratio = Math.min(hRatio,vRatio)
                const centerShift_x = ( 400 - img.width*ratio ) / 2;
                const centerShift_y = ( 400 - img.height*ratio ) / 2;
                setSelectedImage(image);
                context.clearRect(0,0,400,400)
                context.drawImage(img,0,0,img.width,img.height,centerShift_x,centerShift_y,img.width*ratio,img.height*ratio)
                setResizeHeight(img.height)
                setResizeWidth(img.width)
              }
            } catch (error) {
              console.log("error ",error)
            }
          }}
        />

      <div style={{display:'flex',flexDirection:'row',justifyContent:'space-evenly',alignItems:'center',width:'100%',marginTop:20}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          <h6>Input Canvas</h6>
          <canvas id="inputCanvas" ref={inputCanvas} width="400" height="400" style={{border:'1px solid #000000'}}>
          </canvas>
      </div>
        {selectedImage&&
          <div style={{display:'flex',flexDirection:'column',justifyContent:'centerr',alignItems:'center'}}>
            <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:100}}>
              <label htmlFor='heightInput'>Height</label>
              <input  id='heightInput' value={resizeHeight} placeholder='height' style={{width:50,height:35}} onChange={e=>{
                if(!isNaN(e.target.value))
                  setResizeHeight(e.target.value)
                }
              }
              />
            </div>
            <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:10,marginBottom:15,width:100}}>
              <label htmlFor='widthInput'>Width</label>
              <input id='widthInput' value={resizeWidth} placeholder='width' style={{width:50,height:35}}  onChange={e=>{
                  if(!isNaN(e.target.value))
                  setResizeWidth(e.target.value)
                }
              }/>
            </div>
            <Button as='button' size='sm' type='button' disabled={!resizeHeight || !resizeWidth}variant='success' onClick={async()=>{
              setLoading(true)
              console.log("need to send a resize request to django server in the backend")
              const base64 = await convertBase64(selectedImage)
              console.log("base64 input",base64.slice(0,50))
              const base64Arr=base64.split(',')
              const data ={base64:base64Arr[1],height:resizeHeight,width:resizeWidth,type:selectedImage.type.replace('image/','.')}
              const response=await fetch('http://127.0.0.1:8000/resize/',{
                method: 'POST',
                body: JSON.stringify(data)
              })
              let {base64:rBase64} = await response.json()
              console.log("base64 output",rBase64.slice(0,50))

              // rBase64 = base64Arr[0]+','+rBase64

              const blob = base64StringToBlob(rBase64,base64Arr[0])
              const url =URL.createObjectURL(blob)
              const context = outputCanvas.current.getContext('2d');
              const img =new Image()
              img.src=url

              img.onload = function(){
                const hRatio = 400/img.width
                const vRatio = 400/img.height
                const ratio = Math.min(hRatio,vRatio)
                const centerShift_x = ( 400 - img.width*ratio ) / 2;
                const centerShift_y = ( 400 - img.height*ratio ) / 2;
                context.clearRect(0,0,400,400)
                context.drawImage(img,0,0,img.width,img.height,centerShift_x,centerShift_y,img.width*ratio,img.height*ratio)
                setLoading(false)
                setOutputImage(img)
              }
              img.onerror=function(){
                setLoading(false)
              }

              // setResizeHeight(img.height)
              // setResizeWidth(img.width)

              // const byteCharacters = Buffer.from(json.base64,'base64');
              // const byteArray = new Uint8Array(byteNumbers);

            }}> Resize </Button>
            {outputImage&&
            <Button as='button' size='sm' type='button' variant='primary' style={{marginTop:20}} onClick={()=>{
                saveAs(outputImage.src,'resizedImage'+selectedImage.type.replace('image/','.'))
            }}>Download</Button>
        }

          </div>
        }

      <div style={{display:'flex',flexDirection:'column'}}>
        <h6>Output Canvas</h6>
        <canvas id="outputCanvas" ref={outputCanvas} width="400" height="400" style={{border:'1px solid #000000'}}>
          </canvas>
      </div>
      </div>
    </div>
  );
}

export default App;
