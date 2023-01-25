from django.shortcuts import render
import json
import base64
import cv2
import numpy
from django.http import HttpResponse,JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token


@csrf_exempt
def index(request):
    if(request.method=='POST'):
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        # print("body\n ",body)
        #getting parameters from body
        base_64_string = body['base64']
        height= body['height']
        width= body['width']
        type=body['type']
        #convert image to base64
        # base_64_string += '=' * (-len(base_64_string) % 4)  # restore stripped '='s
        image_bytes = base64.b64decode(base_64_string)
        image_arr = numpy.frombuffer(image_bytes, dtype=numpy.uint8)  # im_arr is one-dim Numpy array

        img = cv2.imdecode(image_arr,cv2.IMREAD_COLOR)


        # print("img" ,img)cc
        #resize

        resized_image = cv2.resize(img,(int(width),int(height)))


        # #convert image to base64
        _,resized_img_arr = cv2.imencode(type, resized_image)
        resized_im_bytes = resized_img_arr.tobytes()

        resized_im_b64 = base64.b64encode(resized_im_bytes)
        b64_str = resized_im_b64.decode('utf-8')

        # print("b64 encoded",resized_im_b64)
        return JsonResponse({'base64':b64_str})
    else:
        return HttpResponse("incorrect request")



def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})

