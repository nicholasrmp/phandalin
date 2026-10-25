# Referência completa da API PixelLab (v2)

Gerada a partir do OpenAPI oficial (`https://api.pixellab.ai/v2/openapi.json`, título "Pixel Lab API", versão "dev"), cruzada com `https://api.pixellab.ai/v2/llms.txt` e `https://www.pixellab.ai/mcp`. Base: `https://api.pixellab.ai/v2`. Auth: `Authorization: Bearer <token>`. Nada aqui é inventado: o que o spec não diz está marcado como **desconhecido**. Descrições longas foram abreviadas; o spec manda. Voltar ao resumo: [SKILL.md](SKILL.md).

## Padrão assíncrono

- A maioria dos POST de geração devolve **202/200 com um job id** (`background_job_id`, ou `tile_id`/`object_id`/`character_id`/`tileset_id`/`ui_asset_id` conforme a família).
- Consultar: `GET /background-jobs/{job_id}` (`status`: `processing`, `completed`, `failed`; resultado em `last_response`; na fila, `last_response.queue_position` e `estimated_wait_seconds`). Intervalo sugerido pelo spec: 2-5 s (animação/rotação v3) ou 5-10 s (demais).
- Famílias com GET próprio: `/tilesets/{id}`, `/tilesets-sidescroller/{id}`, `/tiles-pro/{id}`, `/isometric-tiles/{id}`, `/map-objects/{id}`, `/objects/{id}`, `/characters/{id}`, `/ui-assets/{id}`, `/portrait-character-pro/{job_id}`, `/vocal-animation/{job_id}`, `/generate-font-pro/{job_id}`. **423 = ainda gerando** (cabeçalho `Retry-After`); 404 = não existe; 410 = falhou de vez.
- `DELETE /background-jobs/{job_id}` cancela job em `processing` (job na fila não é cobrado; um já rodando pode ser cobrado). Cancelar e reenviar manda para o fim da fila.
- Erros comuns: 401 token inválido; 402 sem créditos/gerações; 422 validação; 429 jobs simultâneos/limite; 529 rate limit.
- Limite de jobs simultâneos: o spec não dá o número (**desconhecido** pelo spec; neste repo o Tier 3 aceitou 20 ao mesmo tempo).
- Imagens entram como objeto base64 (ver `Base64Image` em Tipos comuns) ou por referência de `/uploads` (guardado 3 dias). Pixel art ampliado deve passar por `POST /unzoom` antes de servir de referência.
- Downloads: as URLs do CDN (`storage_urls`, `frame_urls`, `rotation_urls`) respondem 403 ao User-Agent padrão do Python; mandar `User-Agent: Mozilla/5.0` (medido neste repo).

## Servidor MCP (https://api.pixellab.ai/mcp)

Ferramentas expostas, segundo a página: `create_character` (4 ou 8 direções), `animate_character`, `create_topdown_tileset`, `create_sidescroller_tileset`, `create_isometric_tile`, `create_map_object` (fundo transparente; apaga sozinho em 8 h), `create_image_pixflux`, `create_image_pixen`, `create_image_pro`, `edit_image`, `inpaint_image`, `animate_image`, `get_image`. Instalar: `claude mcp add pixellab https://api.pixellab.ai/mcp -t http -H "Authorization: Bearer ..."` (o token vai na config do cliente MCP; não grave no repositório). O MCP **não** expõe tiles-pro (kit de construção), Pro Flash nem edição de quadros: para isso, a API REST direta.

## Índice

- **Create Image**: `POST /generate-image-v2`, `POST /create-image-pixen`, `POST /generate-with-style-v2`, `POST /create-image-pixflux`, `POST /create-image-pixflux-background`, `POST /create-image-bitforge`, `POST /create-image-pro-flash`, `GET /pro-flash/capabilities`, `GET /pro-flash/cost`
- **Image to Pixel Art**: `POST /image-to-pixelart`, `POST /image-to-pixelart-pro`, `POST /image-to-pixelart-pro-flash`
- **Character Creation**: `POST /create-character-v3`, `POST /create-character-pro`, `POST /characters/animations`, `POST /animate-character`, `POST /create-character-state`, `POST /create-character-with-4-directions`, `POST /create-character-with-8-directions`, `POST /create-character-pro-flash`
- **Character Library**: `GET /characters`, `GET /characters/{character_id}`, `DELETE /characters/{character_id}`, `GET /characters/{character_id}/zip`, `GET /characters/{character_id}/spritesheet`, `PATCH /characters/{character_id}/tags`, `DELETE /characters/{character_id}/animations`, `DELETE /characters/{character_id}/animations/{animation_group_id}`, `DELETE /characters/{character_id}/animations/{animation_group_id}/directions/{direction}`
- **Object Creation**: `POST /create-1-direction-object`, `POST /create-8-direction-object`, `POST /objects/{object_id}/animations`, `POST /objects/{object_id}/states`, `POST /objects/{object_id}/select-frames`, `POST /objects/{object_id}/dismiss-review`, `POST /create-object-pro-flash`
- **Object Library**: `DELETE /objects/{object_id}/animations`, `GET /objects`, `GET /objects/{object_id}`, `DELETE /objects/{object_id}`, `PATCH /objects/{object_id}/tags`, `GET /objects/{object_id}/spritesheet`
- **Animate**: `POST /animate-with-text-v3`, `POST /animate-pixminimax`, `POST /interpolation-v2`, `POST /edit-animation-v2`, `POST /transfer-outfit-v2`, `POST /animate-with-text-v2`, `POST /animate-with-text`
- **Skeleton Animation**: `POST /estimate-skeleton`, `POST /animate-with-skeleton-v3`, `POST /animate-with-skeleton`
- **VFX**: `POST /vfx`
- **Rotate**: `POST /generate-8-rotations-v3`, `POST /generate-8-rotations-v2`, `POST /rotate`
- **Edit**: `POST /edit-images-v2`, `POST /edit-image-pixen`, `POST /edit-image`, `POST /edit-image-pro-flash`
- **Inpaint**: `POST /inpaint-v3`, `POST /inpaint`, `POST /inpaint-image-pro-flash`
- **Tilesets**: `POST /tilesets`, `GET /tilesets`, `POST /create-tileset`, `GET /tilesets/{tileset_id}`, `DELETE /tilesets/{tileset_id}`, `POST /tilesets-sidescroller`, `GET /tilesets-sidescroller`, `POST /create-tileset-sidescroller`, `DELETE /tilesets-sidescroller/{tileset_id}`, `GET /tilesets-sidescroller/{tileset_id}`
- **Tiles**: `POST /create-tiles-pro`, `GET /tiles-pro/{tile_id}`, `DELETE /tiles-pro/{tile_id}`, `GET /tiles-pro`, `POST /create-isometric-tile`, `GET /isometric-tiles/{tile_id}`, `DELETE /isometric-tiles/{tile_id}`, `GET /isometric-tiles`
- **Map Objects**: `POST /map-objects`, `GET /map-objects/{object_id}`
- **Game UI**: `POST /create-ui-asset`, `POST /generate-ui-v2`, `GET /ui-assets`, `GET /ui-assets/{ui_asset_id}`, `DELETE /ui-assets/{ui_asset_id}`
- **Portraits & Voice**: `POST /portrait-character-pro`, `GET /portrait-character-pro/{job_id}`, `POST /characters/{character_id}/portrait`, `POST /vocal-animation`, `GET /vocal-animation/{job_id}`, `POST /talking-gif`, `POST /lip-sync`
- **Fonts**: `POST /generate-font-pro`, `GET /generate-font-pro/{job_id}`
- **Cleanup**: `POST /unzoom`, `POST /correct-pixelart`, `POST /reduce-colors`, `POST /remove-background`, `POST /normal-map`, `POST /resize`
- **Enhance Prompt**: `POST /enhance-pixen-prompt`, `POST /enhance-character-v3-prompt`, `POST /enhance-animation-v3-prompt`
- **Image to Text**: `POST /image-to-text`
- **Jobs**: `GET /background-jobs/{job_id}`, `DELETE /background-jobs/{job_id}`
- **Account**: `GET /balance`
- **Uploads**: `POST /uploads`, `POST /uploads/{ticket}`
- **Documentation**: `GET /llms.txt`


---

## Create Image


### `POST /generate-image-v2` — Generate image (Pro)

Generate pixel art images from text description. This endpoint creates multiple pixel art images based on a text description, with optional reference images for style and subject guidance. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Text-to-image pixel art generation - Optional reference images for subject guidance (up to 4) - Optional style image for consistent pixel art style - Optional colour palette (`target_palette`, beta): 2-256 hex colours the image is drawn for and every result pixel is put on (1-bit, Game Boy, PICO-8, NES, any Lospec palette as hex), plus an optional `max_colors` cap per image. With a palette, set `style_options.color_palette` to false - the palette sets the colours - Automatic background removal - Non-blocking: returns job ID immediately **Output Counts by Size (by max dimension):** - Up to 32px: 64 images (8x8 grid) - 33-35px: 49 images (7x7 grid) - 36-41px: 36 images (6x6 grid) - 42-50px: 25 images (5x5 grid) - 51-64px: 16 images (4x4 grid) - 65-84px: 9…


**Corpo** (`application/json`, `GenerateImageV2Request`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the image to generate
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__generate_image_v2__ImageSize` — Size of the output image
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`true` — Remove background from generated images
- `reference_images`: array of `app__endpoints__external__v2__generate_image_v2__ReferenceImage` [maxItems=4] (nullable) — Optional reference images for subject guidance (up to 4)
- `style_image`: `app__endpoints__external__v2__generate_image_v2__ReferenceImage` (nullable) — Optional style image for pixel size and style reference
- `style_options`: `StyleOptions` — Options for what to copy from the style image
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors the image is drawn for them and every pixel is one of…

**Resposta 202** `GenerateImageV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /create-image-pixen` — Create image (pixen)

Generates a pixel art image using the Pixen model. Supported image size: - Minimum side 16 and maximum area 512x512 - Width and height must be divisible by 4 - Must be square when either side is below 32 Supported features: - Transparent background - Outline and detail style controls - View and direction


**Corpo** (`application/json`, `CreateImagePixenRequest`):

- `description` **(obrigatório)**: string — Text description of the image to generate
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_image_pixen__ImageSize`
- `outline`: `Outline` (nullable) — Outline style
- `detail`: `Detail` (nullable) default=`"highly detailed"` — Detail level (default: highly detailed)
- `view`: `CameraView` (nullable) — Camera view angle
- `direction`: `Direction` (nullable) — Subject direction
- `no_background`: boolean default=`false` — Generate with transparent background. Up to 65,536 px of area (e.g. 256x256 or 512x128); larger canvases are refused with it on.
- `background_removal_task`: string enum: `remove_simple_background`, `remove_complex_background` default=`"remove_simple_background"` — Background removal complexity. 'remove_simple_background' is faster, 'remove_complex_background' handles complex edges better
- `seed`: integer (nullable) — Seed decides the starting noise
- `enhance_prompt`: boolean default=`false` — If true, automatically expand your description into a richer, more detailed prompt before generating — equivalent to calling /v2/enhance-pixen-prompt first and passing the result here. Costs an additional 0.05…

**Resposta 200** `CreateImagePixenResponse`: `usage`:Usage (nullable), `image`:Base64Image, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `POST /generate-with-style-v2` — Generate with style (Pro)

Generate new pixel art images that match the style of reference images. This endpoint creates new pixel art based on a text description while matching the visual style (colors, shading, detail level) of provided style reference images. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Style-consistent generation from reference images - Multiple style references supported (1-4 images) - Optional style description for fine-tuning - Automatic background removal - Non-blocking: returns job ID immediately **Output Size:** - Deduced from the style images: the largest dimension across all style images becomes the (square) output size, minimum 16, maximum 512 pixels - Non-square style images are centered on a square canvas **Output Counts by Size:** - 16-32 pixels: Returns 64 images (8x8 grid) - 33-35 pixels: Returns 49 images (7x7 grid) - 36-41 pixels: Returns 36 images (6x6 grid) - 42-50 pixels: Returns 25 images (5x5 grid) - 51-64 pixels: Returns 16 images (4x4 grid) - 65-84 pixels: Returns 9…


**Corpo** (`application/json`, `GenerateWithStyleV2Request`):

- `style_images` **(obrigatório)**: array of `StyleImage` [minItems=1, maxItems=4] — Style reference images (1-4 images)
- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of what to generate
- `style_description`: string [maxLen=500] (nullable) — Description of the style to match
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`true` — Remove background from generated images
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every image is one of them; max_colors…
- `image_size`: object (nullable) — REMOVED. Output size is deduced from the style images.

**Resposta 202** `GenerateWithStyleV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /create-image-pixflux` — Create image (pixflux)

Creates a pixel art image based on the provided parameters. Called "Create image (new)" in the plugin. Supported image size: - Minimum area 32x32 and maximum area 400x400 Supported features: - Init image - Forced palette - Transparent background


**Corpo** (`application/json`, `CreateImagePixfluxRequest`):

- `description` **(obrigatório)**: string — Text description of the image to generate
- `negative_description`: string default=`""` — (Deprecated)
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_image_pixflux__ImageSize`
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8` — How closely to follow the text description
- `outline`: `Outline` (nullable) — Outline style reference (weakly guiding)
- `shading`: `Shading` (nullable) — Shading style reference (weakly guiding)
- `detail`: `Detail` (nullable) — Detail style reference (weakly guiding)
- `view`: `CameraView` (nullable) — Camera view angle (weakly guiding)
- `direction`: `Direction` (nullable) — Subject direction (weakly guiding)
- `isometric`: boolean default=`false` — Generate in isometric view (weakly guiding)
- `no_background`: boolean default=`false` — Generate with transparent background, (blank background over 200x200 area)
- `background_removal_task`: string enum: `remove_simple_background`, `remove_complex_background` default=`"remove_simple_background"` — Background removal complexity. 'remove_simple_background' is faster, 'remove_complex_background' handles complex edges better
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 200** `CreateImagePixfluxResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `POST /create-image-pixflux-background` — Create image (pixflux, background)

Creates a pixel art image based on the provided parameters, as a background job. Same parameters and output as `POST /create-image-pixflux`, but returns immediately with a background job ID instead of holding the connection open during generation. Supported image size: - Minimum area 32x32 and maximum area 400x400 Supported features: - Init image - Forced palette - Transparent background **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, the image is in `last_response.image.base64`


**Corpo** (`application/json`, `CreateImagePixfluxRequest`):

- `description` **(obrigatório)**: string — Text description of the image to generate
- `negative_description`: string default=`""` — (Deprecated)
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_image_pixflux__ImageSize`
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8` — How closely to follow the text description
- `outline`: `Outline` (nullable) — Outline style reference (weakly guiding)
- `shading`: `Shading` (nullable) — Shading style reference (weakly guiding)
- `detail`: `Detail` (nullable) — Detail style reference (weakly guiding)
- `view`: `CameraView` (nullable) — Camera view angle (weakly guiding)
- `direction`: `Direction` (nullable) — Subject direction (weakly guiding)
- `isometric`: boolean default=`false` — Generate in isometric view (weakly guiding)
- `no_background`: boolean default=`false` — Generate with transparent background, (blank background over 200x200 area)
- `background_removal_task`: string enum: `remove_simple_background`, `remove_complex_background` default=`"remove_simple_background"` — Background removal complexity. 'remove_simple_background' is faster, 'remove_complex_background' handles complex edges better
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 202** `CreateImagePixfluxBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /create-image-bitforge` — Create image (bitforge)

Generates a pixel art image based on the provided parameters. Called "Create S-M image" in the plugin. Supported image size: - Maximum area 200x200 Supported features: - Style image - Inpainting - Init image - Forced palette - Transparent background


**Corpo** (`application/json`, `CreateImageBitforgeRequest`):

- `description` **(obrigatório)**: string — Text description of the image to generate
- `negative_description`: string default=`""` — Text description of what to avoid in the generated image
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_image_bitforge__ImageSize`
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8.0` — How closely to follow the text description
- `extra_guidance_scale`: number [min=0.0, max=20.0] default=`3.0` — (Deprecated)
- `style_strength`: integer [min=0.0, max=100.0] default=`0` — Strength of the style transfer (0-100). 50 = balanced.
- `outline`: `Outline` (nullable) — Outline style reference
- `shading`: `Shading` (nullable) — Shading style reference
- `detail`: `Detail` (nullable) — Detail style reference
- `view`: `CameraView` (nullable) — Camera view angle
- `direction`: `Direction` (nullable) — Subject direction
- `isometric`: boolean default=`false` — Generate in isometric view
- `oblique_projection`: boolean default=`false` — Generate in oblique projection
- `no_background`: boolean default=`false` — Generate with transparent background
- `coverage_percentage`: number [min=0.0, max=100.0] (nullable) — Percentage of the canvas to cover
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `style_image`: `Base64Image` (nullable) — Reference image for style transfer
- `inpainting_image`: `Base64Image` (nullable) — Reference image which is inpainted
- `mask_image`: `Base64Image` (nullable) — Inpainting / mask image (black and white image, where the white is where the model should inpaint)
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `skeleton_guidance_scale`: number [min=0.0, max=5.0] default=`1.0` — How closely to follow the skeleton keypoints
- `skeleton_keypoints`: array of `Point` (nullable) — Skeleton points. Warning! Sizes that are not 16x16, 32x32 and 64x64 can cause the generations to be lower quality
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 200** `CreateImageBitforgeResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `POST /create-image-pro-flash` — Create image (Pro Flash)

Create one native pixel-art image with an optional left-box style image. Poll GET /v2/background-jobs/{background_job_id}; completed last_response contains encoded PNGs, image_url, source_image_id and actual billing usage. Download through /mcp/images/{background_job_id}/download. Save the durable source_image_id for later Pro Flash character/object rotations. Five image generation units provisionally; query /v2/pro-flash/cost for current pricing. Optional colour palette (`target_palette`, beta): 2-256 hex colours the image is drawn for and every result pixel is put on (1-bit, Game Boy, PICO-8, any Lospec palette as hex), plus an optional `max_colors` cap. The style image keeps lending its look; its colours give way to the palette.


**Corpo** (`application/json`, `CreateImageProFlashRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000]
- `image_size` **(obrigatório)**: `ProFlashImageSize` — Native sizes: 16x16 (experimental), 24x24, 32x32, 32x48, 48x48, 64x64, 96x64, 96x96, 128x128. Custom size (Beta): integer width 16–256 and height 16–256. Both dimensions must be multiples of 4 pixels.…
- `no_background`: boolean default=`true`
- `style_image`: `ProFlashReferenceImage` (nullable)
- `style_options`: `ProFlashStyleOptions`
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors the image is drawn for them and every pixel is one of…
- `seed`: integer [min=0.0] default=`0` — Recorded seed; the same seed does not promise the same image.
- `project_id`: string (uuid) (nullable)

**Resposta 202** `ProFlashImageResponse`: `usage`:Usage (nullable), `background_job_id`:string, `image_id`:string, `source_image_id`:string, `status`:string, `output_count`:integer, `image_size`:ProFlashImageSize, `estimated_generations`:integer, `pricing_provisional`:boolean

### `GET /pro-flash/capabilities` — Get Pro Flash capabilities

Get native presets, beta creation dimensions and supported controls.


**Resposta 200** (application/json): object

### `GET /pro-flash/cost` — Estimate Pro Flash generation cost

Separate provisional first-image and V3 rotation generation units. The total includes the first direction and requested rotations in one call. Finishing an already-paid preview only charges the rotations component; a one-direction object finalization is free. Actual billed usage is reported on job completion.

- **query param** `operation` (obrigatório): string enum: `create`, `edit`, `inpaint`, `character`, `object`
- **query param** `width` (obrigatório): integer [>=0]
- **query param** `height` (obrigatório): integer [>=0]
- **query param** `n_directions`: integer default=`8`

**Resposta 200** (application/json): object

---

## Image to Pixel Art


### `POST /image-to-pixelart` — Convert image to pixel art

Convert regular images to pixel art style. Supported image sizes: - Input: Minimum 16x16, maximum 2048x2048 - Output: Minimum 16x16, maximum 512x512 **Best practices:** - Recommended output sizes is 1/4 of the input size - Keep the same aspect ratio as the input image **Staying close to the source:** by default the model reinterprets the image as pixel art. To reproduce it faithfully instead, set `fixer=true` (faithful mode) and raise `init_image_strength` (0-999), which starts the diffusion from the source image rather than from noise.


**Corpo** (`application/json`, `ImageToPixelartRequest`):

- `image` **(obrigatório)**: `Base64Image` — Image to convert to pixel art
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__image_to_pixelart__ImageSize` — Size of the input image
- `output_size` **(obrigatório)**: `OutputSize` — Desired output size
- `text_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`8.0` — How closely to follow pixel art style
- `init_image_strength`: integer [min=0.0, max=999.0] default=`0` — How strongly to start from the source image (img2img). 0 redraws from scratch using the source only as guidance; higher values keep more of the source. 100-300 is the useful range. Beyond that the model barely…
- `fixer`: boolean default=`false` — Faithful mode. Stays true to the source image instead of re-interpreting it as pixel art. Best combined with a high init_image_strength when converting artwork you want reproduced rather than reimagined.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation

**Resposta 200** `ImageToPixelartResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 400 Invalid image size constraints; 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /image-to-pixelart-pro` — Convert image to pixel art (Pro)

Convert an arbitrary image into high-quality pixel art. Unlike `image-to-pixelart`, the output size is decided automatically — the native pixel scale is detected and the result is downscaled and cleaned up for you, so you don't pass an output size. Provide an optional `description` to nudge the style (palette, dithering, mood). Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve the result. **Input:** any PNG/JPEG. Images larger than 2048px on the longest side are scaled down before conversion. **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, the pixel art image is in `last_response`


**Corpo** (`application/json`, `ImageToPixelartProRequest`):

- `image` **(obrigatório)**: `Base64Image` — Image to convert to pixel art (base64 PNG/JPEG)
- `description`: string [minLen=1, maxLen=2000] (nullable) — Optional extra style instructions
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the image is one of them; max_colors…
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation

**Resposta 202** `ImageToPixelartProResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /image-to-pixelart-pro-flash` — Convert image to pixel art (Pro Flash)

Convert a photo, painting or render into pixel art, faster and cheaper than Pro. Same conversion as `image-to-pixelart-pro`: the native pixel scale is detected and the output size is chosen for you, so there is no size parameter. Add an optional `description` to steer the style. Sources over 2048px on the longest side are scaled down first. Costs 6 generations per image. Returns a background job. Poll `GET /v2/background-jobs/{background_job_id}`; when it completes, the image is in `last_response` and also saved to your gallery as `source_image_id`.


**Corpo** (`application/json`, `ImageToPixelartProFlashRequest`):

- `image` **(obrigatório)**: `Base64Image` — Image to convert to pixel art (base64 PNG/JPEG)
- `description`: string [minLen=1, maxLen=2000] (nullable) — Optional extra style instructions
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the image is one of them; max_colors…
- `seed`: integer [min=0.0] default=`0` — Seed for reproducible generation
- `project_id`: string (uuid) (nullable)

**Resposta 202** `ImageToPixelartProFlashResponse`: `usage`:Usage (nullable), `background_job_id`:string, `image_id`:string, `source_image_id`:string, `status`:string, `output_count`:integer, `estimated_generations`:integer, `pricing_provisional`:boolean

---

## Character Creation


### `POST /create-character-v3` — Create character (v3, 8 rotations)

Create a character with 8 directional rotations using the v3 model. **Two modes:** 1. **Reference image** — provide `reference_image` (south-facing sprite) and the v3 model rotates it into 8 directional views. Cost: `ceil(w*h*8 / 65536)` generations. 2. **From scratch** — omit `reference_image` and the Pixen model generates a south-facing sprite from `description`, then v3 rotates it. Cost: 1 (pixen) + `ceil(s*s*8 / 65536)` where s = max(width, height). Supports `outline` and `detail` style params. The result is persisted as a character — same system as `/v2/create-character-with-8-directions` — so it can be animated, downloaded, and listed alongside template-created characters. **Reference image must be south-facing for best results.** The frontend Character Creator enforces this and the v3 model is trained around a south-facing input. **Sizes:** - `reference_image`: max 256x256 pixels. - From-scratch `image_size`: 32-256 pixels (default 64x64). This size is sent to the sprite generator; a non-square result is padded to a `max(width, height)` square before rotation, and the…


**Corpo** (`application/json`, `CreateCharacterV3Request`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the character (used as prompt + display name).
- `reference_image`: `Base64Image` (nullable) — South-facing reference image (PNG/JPEG base64). If provided, the v3 model rotates it into 8 directions. If omitted, a sprite is generated from `description` using Pixen first. Max 256x256 pixels.
- `direction_images`: object (nullable) — Reference mode only: sprites you already drew for other directions. Each is used exactly as drawn and v3 generates only the directions you leave out. If every direction is covered (7 for 8 directions,…
- `n_directions`: integer enum: `4`, `8` default=`8` — Reference mode only: 8 for a full rotation, 4 to keep south/east/north/west (`direction_images` may then only hold east, north and west).
- `image_size`: `V3OutputImageSize` (nullable) — Output frame size. For reference mode this is advisory (model picks its own size). For from-scratch mode this controls the requested generation size (32-256, default 64x64); a non-square result is padded to a…
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"` — Camera view angle. Used by both generation and skeleton reconstruction.
- `template_id`: string default=`"mannequin"` — Body type for skeleton reconstruction. Picks the 3D template the skeleton estimator fits to the generated frames so the character can be animated. Use `mannequin` for bipedal subjects or one of…
- `name`: string (nullable) — Display name. Defaults to first 50 chars of `description`.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation.
- `no_background`: boolean (nullable) default=`true` — Generate frames with transparent background.
- `outline`: string (nullable) default=`"single color black outline"` — Outline style hint for from-scratch mode (soft guidance — the model may not follow exactly). Ignored when reference_image is provided.
- `detail`: string (nullable) default=`"medium detail"` — Detail level hint for from-scratch mode (soft guidance — the model may not follow exactly). Ignored when reference_image is provided.
- `enhance_prompt`: boolean default=`false` — If true, automatically expand `description` into a richer prompt before generating — equivalent to calling /v2/enhance-character-v3-prompt first. Only valid in from-scratch mode (omit `reference_image`);…

**Resposta 200** `CreateCharacterV3Response`: `usage`:Usage (nullable), `background_job_id`:string, `character_id`:string, `status`:string, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Concurrency limit reached

### `POST /create-character-pro` — Create character with Pro mode (8 directions)

Create a character with 8 directional rotations using Pro mode. Pro mode uses a reference-based generator for higher quality and finer style control than template-based standard mode. The result is persisted as a character — same system as `/v2/create-character-with-8-directions` — so it can be animated, downloaded, and listed alongside template-created characters. **Three methods** (controlled by the `method` field): - `create_with_style` (default): text + optional style reference image. - `create_from_concept`: text + concept image (e.g. a sketch/mood board) + optional style reference. - `rotate_character`: rotate an existing character image into 8 directions. **Style character** (`style_character_id`): pass the id of one of your existing 8-direction characters to use it as the style reference — its 8 directional sprites guide the new character's style in every direction. Combine with `create_with_style` (text-driven) or `create_from_concept` (concept image in that character's style). **Sizes:** - `image_size`: 32-168 pixels (requested output frame). The persisted rotations share…


**Corpo** (`application/json`, `CreateCharacterProRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the character or object to generate.
- `image_size` **(obrigatório)**: `ProImageSize` — Requested output frame size for each of the 8 rotations. The persisted rotations share a square canvas whose side is at least max(width, height) and may grow up to 256 pixels to fit generated content.
- `method`: string enum: `create_with_style`, `create_from_concept`, `rotate_character` default=`"create_with_style"` — How the reference inputs are used: - `create_with_style`: text-driven generation; `reference_image` (if provided) is treated as a style reference. If omitted, a default style for the chosen `view` and template…
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"` — Camera view angle.
- `template_id`: string default=`"mannequin"` — Body type for skeleton reconstruction. Picks the 3D template the skeleton estimator fits to the generated frames so the character can be animated. Use `mannequin` for bipedal subjects or one of…
- `concept_image`: `Base64Image` (nullable) — Optional concept image (max 1024x1024). Used with `method=create_from_concept`.
- `reference_image`: `Base64Image` (nullable) — Optional reference image (max 168x168). Used as style reference for `create_with_style` / `create_from_concept`, or as the character to rotate for `rotate_character`.
- `style_character_id`: string (nullable) — ID of one of your existing 8-direction characters to use as the style reference. Its 8 directional sprites guide the new character's style in every direction; its south sprite becomes the center style image…
- `style_description`: string [maxLen=2000] (nullable) — Free-text style hint to layer on top of the description.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation.
- `no_background`: boolean (nullable) default=`true` — Generate with transparent background.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of all 8 directions is one of them;…

**Resposta 200** `CreateCharacterProResponse`: `usage`:Usage (nullable), `background_job_id`:string, `character_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Concurrency limit reached

### `POST /characters/animations` — Create Character Animation

Animate an existing character (background processing). Modes: - **template**: Provide template_animation_id for skeleton-based animation (1 gen/direction; canvases over ~100px bill per batch, up to one per clip frame at 256px). - **v3** (default when no template): Custom animation from action text. Supports frame_count (4-16). One job per direction. - **pixminimax**: Custom animation from action text on PixMiniMax (beta). frame_count multiples of 4 up to 40. One job per direction. - **pro** (legacy, prefer v3 or pixminimax): Custom animation that generates directions sequentially, using completed sides as reference (10-25 gen/direction).


**Corpo** (`application/json`, `CreateCharacterAnimationRequest`):

- `character_id` **(obrigatório)**: string — ID of existing character to animate
- `animation_group_id`: string (uuid) (nullable) — Pass the animation_group_id of an existing animation on this character to add more directions to it. Omit to create a new animation; the new animation_group_id is returned so subsequent calls can extend it.…
- `animation_name`: string (nullable) — Name for this animation (defaults to action_description if not provided)
- `description`: string [minLen=1, maxLen=2000] (nullable) — Description of the character or object to animate (uses character's original if not specified)
- `action_description`: string (nullable) — Action description (e.g., 'walking', 'running', 'jumping'). Required for custom mode (when template_animation_id is omitted). For template mode, defaults to a description based on the template.
- `async_mode`: const `True` (nullable) default=`true` — Process in background (always true - no foreground processing yet)
- `mode`: string enum: `template`, `skeleton-v3`, `v3`, `pixminimax`, `pro` (nullable) — Animation mode. "template": skeleton-based from template_animation_id (1 gen/direction; canvases over ~100px run in batches billed 1 each, up to one per clip frame at 256px). "skeleton-v3": the same…
- `template_animation_id`: string (nullable) — Animation template ID. Required for template mode. Available: `angry`, `attack`, `attack-back`, `attack-left`, `attack-right`, `backflip`, `bark`, `breathing-idle`, `cross-punch`, `crouched-walking`, ...
- `frame_count`: integer [min=4.0, max=40.0] (nullable) default=`8` — Number of animation frames. v3 mode: 4-16, even. pixminimax mode: a multiple of 4 from 4 to 40. Not used in other modes.
- `custom_start_frame`: `Base64Image` (nullable) — Optional custom starting pose for the animation (`mode='v3'` or `mode='pixminimax'`). When omitted, the character's rotation image for the chosen direction is used as the start. Max 256x256. Requires exactly…
- `end_frame`: `Base64Image` (nullable) — Optional target pose to interpolate toward (`mode='v3'` or `mode='pixminimax'`). Providing this enables interpolation mode: the model animates between the start frame (rotation image or `custom_start_frame`)…
- `keep_first_frame`: boolean default=`true` — Keep the reference frame as frame 0 of the stored animation (`mode='v3'` or `mode='pixminimax'`). Set `false` to store exactly `frame_count` generated frames — the reference start frame is stripped, so…
- `subject_description`: string [minLen=1, maxLen=300] (nullable) — `mode='pixminimax'` only: what the character is, one noun phrase (e.g. 'a knight in silver plate armour'). Omit to have it read from the character's image.
- `initial_pose`: string [minLen=1, maxLen=300] (nullable) — `mode='pixminimax'` only: the pose the first frame is in (e.g. 'standing upright with the sword lowered'). Omit to have it read from the image.
- `text_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`8.0` — How closely to follow the text description (higher = more faithful). Template mode only.
- `outline`: string (nullable) — Outline style (uses character's original if not specified). Template mode only.
- `shading`: string (nullable) — Shading style (uses character's original if not specified). Template mode only.
- `detail`: string (nullable) — Detail level (uses character's original if not specified). Template mode only.
- `directions`: array of string (nullable) — List of directions to animate (south, north, east, west, etc.). Template mode: defaults to all character directions. Custom mode: defaults to south only.
- `isometric`: boolean (nullable) default=`false` — Generate in isometric view
- `color_image`: `Base64Image` (nullable) — Color palette reference image
- `force_colors`: boolean (nullable) default=`false` — Force the use of colors from color_image
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every frame of every direction (modes…
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `enhance_prompt`: boolean default=`false` — If true, automatically expand `action_description` into a richer motion description before generating — equivalent to calling /v2/enhance-animation-v3-prompt with the character's south-facing frame first. The…

**Resposta 200** `CreateCharacterAnimationResponse`: `background_job_ids`:array of string, `directions`:array of string, `animation_group_id`:string (nullable), `status`:string, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

### `POST /animate-character` — Animate character

Animate an existing character with multiple frames showing movement or action. This endpoint creates animation sequences for characters that were previously created using the create-character-with-4-directions or create-character-with-8-directions endpoints. **Key Features:** - Animate existing characters by character_id - Support for multiple directions (or all character directions) - Flexible frame count (2-12 frames) - Template-based animations for consistent motion - Asynchronous processing for multiple directions - Automatic storage and organization **Character Requirements:** - Character must exist and belong to the authenticated user - Character must have been created with 4 or 8 directions - Animation will use the same template and settings as the character **Direction Handling:** - Multiple directions per request (specify via directions field) - If directions field is None/empty, animates all available directions - Each direction creates a separate background job - Returns list of job IDs (one per direction) **AI Freedom Parameter:** - ai_freedom controls how closely the AI…


**Corpo** (`application/json`, `CreateCharacterAnimationRequest`):

- `character_id` **(obrigatório)**: string — ID of existing character to animate
- `animation_group_id`: string (uuid) (nullable) — Pass the animation_group_id of an existing animation on this character to add more directions to it. Omit to create a new animation; the new animation_group_id is returned so subsequent calls can extend it.…
- `animation_name`: string (nullable) — Name for this animation (defaults to action_description if not provided)
- `description`: string [minLen=1, maxLen=2000] (nullable) — Description of the character or object to animate (uses character's original if not specified)
- `action_description`: string (nullable) — Action description (e.g., 'walking', 'running', 'jumping'). Required for custom mode (when template_animation_id is omitted). For template mode, defaults to a description based on the template.
- `async_mode`: const `True` (nullable) default=`true` — Process in background (always true - no foreground processing yet)
- `mode`: string enum: `template`, `skeleton-v3`, `v3`, `pixminimax`, `pro` (nullable) — Animation mode. "template": skeleton-based from template_animation_id (1 gen/direction; canvases over ~100px run in batches billed 1 each, up to one per clip frame at 256px). "skeleton-v3": the same…
- `template_animation_id`: string (nullable) — Animation template ID. Required for template mode. Available: `angry`, `attack`, `attack-back`, `attack-left`, `attack-right`, `backflip`, `bark`, `breathing-idle`, `cross-punch`, `crouched-walking`, ...
- `frame_count`: integer [min=4.0, max=40.0] (nullable) default=`8` — Number of animation frames. v3 mode: 4-16, even. pixminimax mode: a multiple of 4 from 4 to 40. Not used in other modes.
- `custom_start_frame`: `Base64Image` (nullable) — Optional custom starting pose for the animation (`mode='v3'` or `mode='pixminimax'`). When omitted, the character's rotation image for the chosen direction is used as the start. Max 256x256. Requires exactly…
- `end_frame`: `Base64Image` (nullable) — Optional target pose to interpolate toward (`mode='v3'` or `mode='pixminimax'`). Providing this enables interpolation mode: the model animates between the start frame (rotation image or `custom_start_frame`)…
- `keep_first_frame`: boolean default=`true` — Keep the reference frame as frame 0 of the stored animation (`mode='v3'` or `mode='pixminimax'`). Set `false` to store exactly `frame_count` generated frames — the reference start frame is stripped, so…
- `subject_description`: string [minLen=1, maxLen=300] (nullable) — `mode='pixminimax'` only: what the character is, one noun phrase (e.g. 'a knight in silver plate armour'). Omit to have it read from the character's image.
- `initial_pose`: string [minLen=1, maxLen=300] (nullable) — `mode='pixminimax'` only: the pose the first frame is in (e.g. 'standing upright with the sword lowered'). Omit to have it read from the image.
- `text_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`8.0` — How closely to follow the text description (higher = more faithful). Template mode only.
- `outline`: string (nullable) — Outline style (uses character's original if not specified). Template mode only.
- `shading`: string (nullable) — Shading style (uses character's original if not specified). Template mode only.
- `detail`: string (nullable) — Detail level (uses character's original if not specified). Template mode only.
- `directions`: array of string (nullable) — List of directions to animate (south, north, east, west, etc.). Template mode: defaults to all character directions. Custom mode: defaults to south only.
- `isometric`: boolean (nullable) default=`false` — Generate in isometric view
- `color_image`: `Base64Image` (nullable) — Color palette reference image
- `force_colors`: boolean (nullable) default=`false` — Force the use of colors from color_image
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every frame of every direction (modes…
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `enhance_prompt`: boolean default=`false` — If true, automatically expand `action_description` into a richer motion description before generating — equivalent to calling /v2/enhance-animation-v3-prompt with the character's south-facing frame first. The…

**Resposta 200** `CreateCharacterAnimationResponse`: `background_job_ids`:array of string, `directions`:array of string, `animation_group_id`:string (nullable), `status`:string, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

Erros: 401 Invalid API token; 402 Insufficient credits; 404 Character or animation_group_id not found; 409 animation_group_id already has one of the requested directions; 429 Too many requests

### `POST /create-character-state` — Create a state of an existing character

Queues a generation job that applies a text edit to an existing character's rotations and saves the result as a new character grouped with the source via group_id. The same edit is applied consistently across all 4 or 8 directions.


**Corpo** (`application/json`, `CreateCharacterStateRequest`):

- `character_id` **(obrigatório)**: string — ID of the source character
- `edit_description` **(obrigatório)**: string [minLen=1, maxLen=1000]
- `no_background`: boolean default=`true`
- `seed`: integer [min=0.0] (nullable)
- `override_frame_size`: `FrameSize` (nullable) — Optional larger canvas for the state, for edits that add something big (a weapon, wings) needing room beyond the character's tight canvas. Width/height must be multiples of 4 and no smaller than the source…
- `state_name`: string [maxLen=100] (nullable) — Name for the new state. Defaults to the edit description truncated to 20 characters.
- `use_color_palette_from_reference`: boolean default=`false` — Snap the edited rotations to the source character's existing color palette so the new state stays color-consistent with the original.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every direction is one of them;…

**Resposta 200** `CreateCharacterStateResponse`: `usage`:Usage (nullable), `background_job_id`:string, `character_id`:string, `status`:string

Erros: 400 Source character is not completed; 401 Invalid API token; 402 Insufficient generations; 404 Source character not found; 429 Concurrent job limit reached

### `POST /create-character-with-4-directions` — Create character with 4 directions

Generate a character or object facing 4 cardinal directions (south, west, east, north). This endpoint creates 4 separate rotation images plus a combined spritesheet in a 4x1 layout. Perfect for game development where you need character sprites facing all directions. **Key Features:** - Fixed 4-rotation layout (south, west, east, north) - Individual rotation images + combined spritesheet - Style customization (outline, shading, detail) - Color palette support - Character proportions customization - Optional reference images per direction (upload some or all) - Optimized for game sprites and character assets **Character Proportions:** - Use preset proportions: chibi, cartoon, stylized, realistic_male, realistic_female, heroic - Or customize individual body proportions: head size, arm/leg length, shoulder/hip width - All characters use the advanced mannequin template with bone scaling **Reference Images (optional `directions` field):** - Provide existing sprites for some or all of south/east/north/west. - Missing directions are AI-generated; provided ones are used as-is (frozen). -…


**Corpo** (`application/json`, `CreateCharacterWith4DirectionsRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the character or object to generate
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_character_with_4_directions__ImageSize` — Size of each rotation image
- `async_mode`: const `True` (nullable) default=`true` — Process asynchronously (always true for character creation)
- `text_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`8.0` — How closely to follow the text description (higher = more faithful)
- `outline`: string (nullable) default=`"single color black outline"` — Outline style hint (soft guidance — the model may not follow exactly). Options: single color black outline, single color outline, selective outline, lineless
- `shading`: string (nullable) default=`"basic shading"` — Shading style hint (soft guidance — the model may not follow exactly). Options: flat shading, basic shading, medium shading, detailed shading
- `detail`: string (nullable) default=`"medium detail"` — Detail level hint (soft guidance — the model may not follow exactly). Options: low detail, medium detail, high detail
- `view`: string (nullable) default=`"low top-down"` — Camera view angle (side, low top-down, high top-down, perspective)
- `isometric`: boolean (nullable) default=`false` — Generate in isometric view
- `color_image`: `Base64Image` (nullable) — Color palette reference image
- `force_colors`: boolean (nullable) default=`false` — Force the use of colors from color_image
- `proportions`: `CharacterProportionsPreset` | `CharacterProportions` (nullable) — Character body proportions (preset or custom values). Only applies to humanoid characters.
- `template_id`: string (nullable) — Template ID to use (e.g., 'mannequin' for humanoid, 'bear'/'cat'/'dog'/'horse'/'lion' for quadrupeds). Defaults to 'mannequin'.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `directions`: object (nullable) — Optional reference images per direction. Allowed keys: 'south', 'east', 'north', 'west'. Missing directions are AI-generated; provided ones are used as-is. Each image's dimensions must match image_size.…
- `output_type`: const `dict` (nullable) default=`"dict"` — Output format (always dict for external API)

**Resposta 200** `CreateCharacterWith4DirectionsResponse`: `usage`:Usage (nullable), `background_job_id`:string, `character_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /create-character-with-8-directions` — Create character with 8 directions

Generate a character or object facing 8 directions (all cardinal and diagonal directions). This endpoint creates 8 rotation images in a dictionary format for easy access by direction name. Perfect for detailed movement systems in games where smooth directional changes are important. **Two Generation Modes:** - **standard** (default): Template-based skeleton generation. Costs 1 generation. Uses all style parameters. - **pro**: AI reference-based generation for higher quality. Costs 10-25 generations depending on size. Ignores outline, shading, detail, proportions, and text_guidance_scale. **The 8 Directions:** - south (facing down) - south-east (diagonal down-right) - east (facing right) - north-east (diagonal up-right) - north (facing up) - north-west (diagonal up-left) - west (facing left) - south-west (diagonal down-left) **Key Features:** - Fixed 8-rotation layout in clockwise order starting from south - Returns dictionary of images by direction name - Style customization (outline, shading, detail) - standard mode only - Color palette support - Character proportions customization…


**Corpo** (`application/json`, `CreateCharacterWith8DirectionsRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the character or object to generate
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_character_with_8_directions__ImageSize` — Size of each rotation image
- `mode`: string enum: `standard`, `pro` (nullable) default=`"standard"` — Generation mode. "standard" uses template-based skeleton generation (1 generation). "pro" uses AI reference-based generation for higher quality (costs 10-25 generations depending on size). Pro mode ignores…
- `async_mode`: const `True` (nullable) default=`true` — Process asynchronously (always true - no synchronous processing yet)
- `text_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`8.0` — How closely to follow the text description (higher = more faithful)
- `outline`: string (nullable) default=`"single color black outline"` — Outline style hint (soft guidance — the model may not follow exactly). Options: single color black outline, single color outline, selective outline, lineless
- `shading`: string (nullable) default=`"basic shading"` — Shading style hint (soft guidance — the model may not follow exactly). Options: flat shading, basic shading, medium shading, detailed shading
- `detail`: string (nullable) default=`"medium detail"` — Detail level hint (soft guidance — the model may not follow exactly). Options: low detail, medium detail, high detail
- `view`: string (nullable) default=`"low top-down"` — Camera view angle (side, low top-down, high top-down, perspective)
- `isometric`: boolean (nullable) default=`false` — Generate in isometric view
- `color_image`: `Base64Image` (nullable) — Color palette reference image
- `force_colors`: boolean (nullable) default=`false` — Force the use of colors from color_image
- `proportions`: `CharacterProportionsPreset` | `CharacterProportions` (nullable) — Character body proportions (preset or custom values). Only applies to humanoid characters.
- `template_id`: string (nullable) — Template ID to use. Must be one of: 'mannequin' (the only humanoid template), 'bear', 'cat', 'dog', 'horse', 'lion' (quadrupeds). Defaults to 'mannequin'. Note 'humanoid' is NOT a template id — it is only a…
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `directions`: object (nullable) — Optional reference images per direction. Allowed keys: 'south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'. Missing directions are AI-generated; provided ones are used…
- `output_type`: const `dict` (nullable) default=`"dict"` — Output format (always dict for external API)
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of all 8 directions (mode='pro' only) is…

**Resposta 200** `CreateCharacterWith8DirectionsResponse`: `usage`:Usage (nullable), `background_job_id`:string, `character_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /create-character-pro-flash` — Create character (Pro Flash)

Generate a south-facing image from description, then create eight V3 views. First-direction generation is included in this one call. Supply image_size and optional style_image to guide creation. Alternatively pass source_image_id or first_frame to reuse a chosen south-facing image and pay only for rotations. Pixels are preserved with transparent padding to the square V3 canvas. Poll the job for itemized billing_stages and combined usage, then read /v2/characters/{character_id} or download /mcp/characters/{character_id}/download.


**Corpo** (`application/json`, `CreateCharacterProFlashRequest`):

- `source_image_id`: string [minLen=1] (nullable) — Optional owned south-facing image ID. Reuses its pixels without another image charge.
- `first_frame`: `Base64Image` (nullable) — Encoded south-facing PNG upload; mutually exclusive with source_image_id.
- `description` **(obrigatório)**: string [minLen=1, maxLen=2000]
- `name`: string [maxLen=200] default=`""`
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"`
- `first_frame_direction`: const `south` default=`"south"`
- `seed`: integer [min=0.0] default=`0`
- `image_size`: `ProFlashImageSize` (nullable) — Defaults to 64x64 for text creation. Native sizes: 16x16 (experimental), 24x24, 32x32, 32x48, 48x48, 64x64, 96x64, 96x96, 128x128. Custom size (Beta): integer width 16–256 and height 16–256. Both dimensions…
- `style_image`: `ProFlashReferenceImage` (nullable)
- `style_options`: `ProFlashStyleOptions` (nullable)
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every direction (a first_frame or…
- `n_directions`: const `8` default=`8`
- `template_id`: string enum: `mannequin`, `bear`, `cat`, `dog`, `horse`, `lion`, `custom` default=`"mannequin"`

**Resposta 202** `CreateCharacterProFlashResponse`: `usage`:Usage (nullable), `background_job_id`:string, `character_id`:string, `status`:string, `estimated_generations`:integer, `first_direction_generated`:boolean

---

## Character Library


### `GET /characters` — List user's characters

List all characters created by the authenticated user. This endpoint returns a paginated list of all characters you've created using the create-character-with-4-directions or create-character-with-8-directions endpoints. **Features:** - Pagination support with limit and offset parameters - Animation count for each character - Preview URLs for quick character identification - Complete character metadata **Authentication:** Requires a valid API token in the Authorization header. **Response includes:** - Character basic info (name, prompt, size, directions) - Creation timestamp and template used - Number of animations created for each character - Preview URL for the south-facing rotation **Pagination:** - Use `limit` to control how many characters to return (1-100) - Use `offset` to skip characters for pagination - Total count is included in response for pagination UI

- **query param** `limit`: integer [min=1, max=100] default=`50` — Maximum number of characters to return
- **query param** `offset`: integer [min=0] default=`0` — Number of characters to skip

**Resposta 200** `CharactersListResponse`: `usage`:Usage (nullable), `characters`:array of CharacterSummary, `total`:integer

Erros: 401 Invalid API token; 429 Too many requests

### `GET /characters/{character_id}` — Get character details

Get detailed information about a specific character. This endpoint returns complete character information including all rotation image URLs, generation settings, and metadata. **Features:** - Complete character information and settings - URLs for all rotation images (4 or 8 directions) - Animation count and template information - Generation parameters used during creation **Authentication:** Requires a valid API token. You can only access characters you created. **Response includes:** - Basic character info (name, prompt, size, directions) - All rotation image URLs (publicly accessible) - Style settings and generation parameters - Template information and view settings - Animation count for this character **URL Format:** All rotation URLs follow the pattern: `https://supabase.pixellab.ai/storage/v1/object/public/pixellab-characters/{user_id}/{character_id}/rotations/{direction}.png`

- **path param** `character_id` (obrigatório): string

**Resposta 200** `CharacterDetail`: `id`:string, `name`:string, `state_name`:string (nullable), `prompt`:string, `size`:CharacterSize, `directions`:integer, `created_at`:string, `updated_at`:string (nullable), `animation_count`:integer, `template_id`:string, `view`:string (nullable), `status`:string, `rotation_urls`:CharacterRotationUrls (nullable), `style_settings`:object (nullable), `guidance`:number (nullable), `ai_freedom`:integer (nullable), `tags`:array of string, `group_id`:string (nullable), `skeletons`:object (nullable), `animations`:array of AnimationGroup

Erros: 401 Invalid API token; 403 Character belongs to another user; 404 Character not found; 429 Too many requests

### `DELETE /characters/{character_id}` — Delete one character state

Delete ONE state of a character (the given id) with its rotations, animations and files. Irreversible. A character is a group of states. Other states in the same group are untouched; the group itself is removed only when its last state is deleted. To delete a whole multi-state character, call this once per state id. `next_state_id` in the response is the most recently updated remaining state, or null if the group is now gone.

- **path param** `character_id` (obrigatório): string

**Resposta 200** `DeleteCharacterResponse`: `usage`:Usage (nullable), `success`:boolean, `character_id`:string (nullable), `files_deleted`:integer (nullable), `animations_deleted`:integer (nullable), `group_id`:string (nullable), `next_state_id`:string (nullable), `error`:string (nullable)

### `GET /characters/{character_id}/zip` — Export character as ZIP

Download a character with all animations as a ZIP file. This endpoint creates a ZIP file containing all rotation images, animation frames, and metadata for a character. Perfect for using characters in external tools, game engines, or archiving your creations. **ZIP Contents:** - `rotations/` - All character rotation images (4 or 8 directions) - `animations/` - All animation frames organized by animation type and direction - `metadata.json` - Complete character information with keypoints for all frames **Collision Detection**: Includes keypoints for all frames + PNG transparency for pixel-perfect collision detection. **File Structure:**

- **path param** `character_id` (obrigatório): string
- **query param** `states`: string (nullable) — Comma-separated state ids to export, all within this character's group. Omit to export every state. Use it to re-pull only the states that changed instead of…

**Resposta 200** (application/json): ?

**Resposta 200** (application/zip): ?

Erros: 423 Character or animations still being generated; 404 Character not found

### `GET /characters/{character_id}/spritesheet` — Export character as spritesheet

Download a character as a single spritesheet image plus a layout JSON. The response is a small ZIP holding two files named after the character: - `<name>.png` — one uniform-grid sheet: row 0 is the rotations (in the standard direction order), then one row per animation-direction, columns are frames in playback order. Every cell has the same size (the largest frame on the sheet); frames are centred in their cell and never rescaled, so the character's pivot is always the cell centre. Unused cells are transparent. - `<name>.json` — the layout: cell size, sheet size, column count, and a row-by-row map saying which animation and direction each row shows. Use the ZIP export (`/characters/{character_id}/zip`) instead when you want individual frame PNGs or every state of a character group — the spritesheet covers the requested character only. **Authentication:** No authentication required - the random character ID serves as the access key. **Status Codes:** - 200: ZIP file (sheet + layout JSON) ready for download - 422: Character generation failed (nothing to export) - 423: Character or…

- **path param** `character_id` (obrigatório): string

**Resposta 200** (application/json): ?

**Resposta 200** (application/zip): ?

Erros: 423 Character or animations still being generated; 404 Character not found

### `PATCH /characters/{character_id}/tags` — Update character tags

Update the tags for a specific character. This endpoint replaces all tags for a character with the provided list. Tags are used for filtering and organizing your characters. **Features:** - Replace all tags at once (set operation) - Automatic normalization (trim whitespace) - Case-insensitive duplicate detection - Maximum 20 tags per character - Maximum 50 characters per tag **Tag Validation:** - Empty strings are ignored - Duplicate tags (case-insensitive) are removed - Leading/trailing whitespace is trimmed - Tags longer than 50 characters are rejected **Common Use Cases:** - Organize characters by game genre: ["rpg", "fantasy"] - Mark character types: ["npc", "enemy", "boss"] - Track creation status: ["finished", "needs-animation"] - Group by visual style: ["cute", "pixel-art", "8-bit"] **Authentication:** Requires a valid API token. You can only update tags for characters you created.

- **path param** `character_id` (obrigatório): string

**Corpo** (`application/json`, `UpdateTagsRequest`):

- `tags` **(obrigatório)**: array of string [maxItems=20] — List of tags to assign to the character

**Resposta 200** `UpdateTagsResponse`: `usage`:Usage (nullable), `tags`:array of string

Erros: 400 Invalid tag format or validation error; 401 Invalid API token; 403 Character belongs to another user; 404 Character not found; 429 Too many requests

### `DELETE /characters/{character_id}/animations` — Delete animations from a character

**Prefer** [DELETE /v2/characters/{character_id}/animations/{animation_group_id}](#tag/character-library/DELETE/characters/{character_id}/animations/{animation_group_id}) (all directions of one animation) and [DELETE /v2/characters/{character_id}/animations/{animation_group_id}/directions/{direction}](#tag/character-library/DELETE/characters/{character_id}/animations/{animation_group_id}/directions/{direction}) (one direction). They address a single animation by id and return 404 for anything that does not exist. This route matches by name: `animation_type` can match several animations on the character, and a typo returns 200 with `deleted_count` 0. Delete character animations by animation_type or animation_group_id, optionally scoped to a single direction. Pass ONE of `animation_type` or `animation_group_id` (group_id is preferred when a name repeats). Omit `direction` to delete all directions at once.

- **path param** `character_id` (obrigatório): string (uuid)
- **query param** `animation_type`: string (nullable) — Animation type shown by get_character (e.g. 'walk', 'idle').
- **query param** `animation_group_id`: string (uuid) (nullable) — Animation group UUID shown by get_character as [group: ...].
- **query param** `direction`: string (nullable) — Single direction to delete (e.g. 'south'). Omit for all.

**Resposta 200** `DeleteAnimationResponse`: `usage`:Usage (nullable), `success`:boolean, `deleted_count`:integer, `label`:string (nullable), `error`:string (nullable)

Erros: 400 Neither animation_type nor animation_group_id supplied; 401 Invalid API token; 404 Character not found or not owned by you; 409 animation_type is ambiguous — pass animation_group_id

### `DELETE /characters/{character_id}/animations/{animation_group_id}` — Delete all directions of a character animation

Delete one animation, every direction of it, by the `animation_group_id` [GET /v2/characters/{character_id}](#tag/character-library/GET/characters/{character_id}) returns. An animation is all directions sharing one `animation_group_id`, the same grouping the PixelLab website shows as one animation. Other animations and other states of the character are untouched. To remove a single direction use [DELETE /v2/characters/{character_id}/animations/{animation_group_id}/directions/{direction}](#tag/character-library/DELETE/characters/{character_id}/animations/{animation_group_id}/directions/{direction}).

- **path param** `character_id` (obrigatório): string (uuid)
- **path param** `animation_group_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteAnimationGroupResponse`: `usage`:Usage (nullable), `animation_group_id`:string, `deleted_directions`:array of string, `label`:string

Erros: 401 Invalid API token; 404 Character, or animation on it, not found

### `DELETE /characters/{character_id}/animations/{animation_group_id}/directions/{direction}` — Delete one direction of a character animation

Delete a single direction of an animation. The rest of the animation keeps its `animation_group_id`; the direction can be generated again into it with [animate-character](#tag/character-creation/POST/characters/animations)'s `animation_group_id`.

- **path param** `character_id` (obrigatório): string (uuid)
- **path param** `animation_group_id` (obrigatório): string (uuid)
- **path param** `direction` (obrigatório): string enum: `south`, `south-east`, `east`, `north-east`, `north`, `north-west`, `west`, `south-west`

**Resposta 200** `DeleteAnimationGroupResponse`: `usage`:Usage (nullable), `animation_group_id`:string, `deleted_directions`:array of string, `label`:string

Erros: 401 Invalid API token; 404 Character, animation, or direction not found

---

## Object Creation


### `POST /create-1-direction-object` — Create a 1-direction object

Queues a 1-direction object generation job. Returns immediately with a `background_job_id` and `object_id`. Poll [GET /v2/objects/{object_id}](#api-1/tag/object-management/GET/objects/{object_id}) for status. Object generation uses the Pro Tools and costs **10–25 generations** per call on a subscription (depending on the resulting image size). Produces one or more single-direction object(s). When `size` results in more than one candidate (see the `size` parameter), the object enters `review` status and you must pick which candidates to keep via [POST /v2/objects/{object_id}/select-frames](#api-1/tag/objects/POST/objects/{object_id}/select-frames) (or discard via [POST /v2/objects/{object_id}/dismiss-review](#api-1/tag/objects/POST/objects/{object_id}/dismiss-review)). A single candidate is kept automatically. For an 8-direction object, use [POST /v2/create-8-direction-object](#api-1/tag/objects/POST/create-8-direction-object). To create a state/variant of an existing object, use [POST /v2/objects/{object_id}/states](#api-1/tag/objects/POST/objects/{object_id}/states). To create an…


**Corpo** (`application/json`, `Create1DirectionObjectRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000]
- `size`: integer [min=16.0, max=256.0] (nullable) — Square image size in pixels (16-256). Defaults to 64 when omitted. Cannot be set together with `style_images` — when style_images are provided, the largest style image determines the output size. The effective…
- `view`: string enum: `top-down`, `sidescroller` default=`"top-down"` — View.
- `style_images`: array of `StyleReferenceImage` — Style reference images, PNG/JPEG base64 (max 256x256 px each). The output size is derived from the largest of these images and determines the max count: ≤85 → 8, ≤170 → 4, else → 1. When empty, a default style…
- `item_descriptions`: array of string (nullable) — Per-object descriptions when the effective size produces multiple objects. Length must not exceed the object count derived from size. Supplying FEWER is allowed and does not shrink the grid: the remaining…
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every object is one of them;…

**Resposta 200** `Create1DirectionObjectResponse`: `usage`:Usage (nullable), `background_job_id`:string, `object_id`:string, `status`:string, `n_frames`:integer

Erros: 401 Invalid API token; 402 Insufficient generations or credits; 429 Concurrent job limit reached

### `POST /create-8-direction-object` — Create an 8-direction object

Queues an 8-direction object generation job. Returns immediately with a `background_job_id` and `object_id`. Poll [GET /v2/objects/{object_id}](#api-1/tag/object-management/GET/objects/{object_id}) for status. Object generation uses the Pro Tools and costs **10–25 generations** per call on a subscription (depending on the resulting image size). Produces an object rendered from 8 angles in one shot. For a static single-direction object, use [POST /v2/create-1-direction-object](#api-1/tag/objects/POST/create-1-direction-object). To create a state/variant of an existing object, use [POST /v2/objects/{object_id}/states](#api-1/tag/objects/POST/objects/{object_id}/states). To create an object placed in a specific map, use [POST /v2/map-objects](#api-1/tag/map-objects/POST/map-objects).


**Corpo** (`application/json`, `Create8DirectionObjectRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000]
- `size`: integer [min=24.0, max=168.0] (nullable) — Square image size in pixels (24-168 — below 24 the eight angles stop being distinguishable, above 168 the pipeline rejects it; use the 1-direction endpoint for 16px). Defaults to 64 when omitted. Cannot be set…
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"` — Camera angle.
- `reference_image`: `Base64Image` (nullable) — Reference image of the object — generates 8 rotations of this exact image. Mutually exclusive with `style_image` and `size`.
- `style_image`: `Base64Image` (nullable) — Style reference — generates a new object matching the description with the style of this image. Mutually exclusive with `reference_image` and `size`.
- `style_object_id`: string (nullable) — ID of one of your existing 8-direction objects to use as the style reference. Its 8 directional sprites guide the new object's style in every direction; its south sprite becomes the center style reference…
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of all 8 directions is one of them;…

**Resposta 200** `Create8DirectionObjectResponse`: `usage`:Usage (nullable), `background_job_id`:string, `object_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient generations or credits; 429 Concurrent job limit reached

### `POST /objects/{object_id}/animations` — Add an animation to an existing object

**Cost warning**: when generating on a subscription, `mode='pro'` costs 10-25 generations per direction (80-200 for a full 8-direction animation). Prefer `mode='v3'` (default) — it usually produces higher quality results and is cheaper. Queues animation jobs — one per direction submitted. Returns immediately with the animation_group_id and per-direction job ids. For 8-direction objects you can later add more directions to the same animation by passing the returned `animation_group_id`. Pass `replace_existing=true` to regenerate a direction that's already been animated. **Interpolation mode (`mode='v3'` only)**: pass `end_frame` to interpolate toward a target pose — the model animates between the start frame and the end frame. The start defaults to the object's idle frame for that direction, but you can override it with `custom_start_frame`. When either frame is provided, exactly one direction must be specified — for 8-direction objects, pass a one-element `directions` list (e.g. `directions=[<cardinal>]`).

- **path param** `object_id` (obrigatório): string (uuid)

**Corpo** (`application/json`, `AnimateObjectRequest`):

- `mode`: string enum: `pro`, `v3` default=`"v3"` — Which animation mode to use. Prefer `'v3'` (default) — it usually produces higher quality results than `'pro'`, and is cheaper. Use `'pro'` only when its different stylistic output is specifically needed.…
- `animation_description`: string [minLen=1, maxLen=1000] (nullable) — Describe the animation, e.g. 'walking cheerfully'. Required when creating a new animation; can be omitted when adding directions to an existing animation via animation_group_id (the existing description is…
- `directions`: array of string enum: `south`, `south-west`, `west`, `north-west`, `north`, `north-east`, `east`, `south-east` (nullable) — Which directions to animate. - **Do not pass `directions` for 1-direction objects.** They always animate the single internal direction; passing this returns 400. - For 8-direction objects: - **New animation**:…
- `animation_group_id`: string (uuid) (nullable) — Mostly only relevant for 8-direction objects: pass the animation_group_id of an existing animation on this object to add more directions to it. Omit to create a new animation; the new animation_group_id is…
- `display_name`: string (nullable) — Optional name for the animation, shown in the UI and used when exporting.
- `frame_count`: integer (nullable) — Frames per direction. Each direction in an animation is independent — you do not need to match `frame_count` across directions when extending an existing animation. Just omit it and the per-mode default is…
- `replace_existing`: boolean default=`false` — Set true to regenerate a direction that has already been animated in this animation. Without this, attempting to re-animate the same direction returns 409.
- `custom_start_frame`: `Base64Image` (nullable) — Optional custom starting pose for the animation (`mode='v3'` only). When omitted, the object's idle frame for the chosen direction is used as the start. When provided, the image's dimensions become the canvas…
- `end_frame`: `Base64Image` (nullable) — Optional target pose to interpolate toward (`mode='v3'` only). Providing this enables **interpolation mode**: the model animates between the start frame (idle or `custom_start_frame`) and this end frame.…
- `keep_first_frame`: boolean default=`true` — Keep the input reference frame as frame 0 of the stored animation (`mode='v3'` only). Set `false` to store exactly `frame_count` generated frames — the reference start frame is stripped, so `frame_count=8`…
- `enhance_prompt`: boolean default=`false` — If true, automatically expand `animation_description` into a richer motion description before generating (mode='v3' only) — equivalent to calling /v2/enhance-animation-v3-prompt first. Grounded on…
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every frame of every direction…

**Resposta 200** `AnimateObjectResponse`: `usage`:Usage (nullable), `animation_group_id`:string, `mode`:string enum: pro, v3, `frame_count`:integer, `display_name`:string (nullable), `description`:string, `object_id`:string, `submissions`:array of DirectionSubmission, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

Erros: 400 Validation error (object not ready, invalid directions/frame_count, missing description for a new animation); 401 Invalid API token; 402 Insufficient generations; 404 Object or animation_group_id not found; 409 Direction already animated (pass replace_existing=true to overwrite); 429 All directions rate-limited (no jobs queued)

### `POST /objects/{object_id}/states` — Create a state of an existing object

Queues a generation job that applies a text edit to an existing object's image(s) and saves the result as a new object grouped with the source via group_id.

- **path param** `object_id` (obrigatório): string (uuid)

**Corpo** (`application/json`, `CreateObjectStateRequest`):

- `edit_description` **(obrigatório)**: string [minLen=1, maxLen=1000]
- `seed`: integer [min=0.0] (nullable)
- `state_name`: string [maxLen=100] (nullable) — Name for the new state. Defaults to the edit description truncated to 20 characters.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the state is one of them; max_colors…

**Resposta 200** `CreateObjectStateResponse`: `usage`:Usage (nullable), `background_job_id`:string, `object_id`:string, `status`:string

Erros: 400 Source object is not completed; 401 Invalid API token; 402 Insufficient generations; 404 Source object not found; 429 Concurrent job limit reached

### `POST /objects/{object_id}/select-frames` — Promote selected frames of a review object to completed objects

- **path param** `object_id` (obrigatório): string (uuid)

**Corpo** (`application/json`, `SelectObjectFramesRequest`):

- `indices` **(obrigatório)**: array of integer — Frame indices (0-based) to keep as completed individual objects.
- `common_tag`: string (nullable) — Optional tag applied to every newly-created object.

**Resposta 200** `SelectObjectFramesResponse`: `usage`:Usage (nullable), `created_object_ids`:array of string

Erros: 400 Object not in review status / invalid indices; 401 Invalid API token; 404 Object not found

### `POST /objects/{object_id}/dismiss-review` — Dismiss a review object without saving any frames

- **path param** `object_id` (obrigatório): string (uuid)

**Resposta 200** `DismissReviewResponse`: `usage`:Usage (nullable)

Erros: 400 Object not in review status; 401 Invalid API token; 404 Object not found

### `POST /create-object-pro-flash` — Create object (Pro Flash)

Generate a south-facing object from description and optionally add V3 views. First-direction generation is included in this one call. Set image_size and optional style_image; n_directions=1 generates one image, n_directions=8 also generates rotations. Alternatively pass source_image_id or first_frame to reuse a chosen image: one-direction finalization is then free and eight views charge only rotations. Objects have no skeleton. The job reports billing_stages. Poll the job, then read /v2/objects/{object_id}; download through /mcp/objects/{object_id}/download (one-direction PNG or eight-direction ZIP).


**Corpo** (`application/json`, `CreateObjectProFlashRequest`):

- `source_image_id`: string [minLen=1] (nullable) — Optional owned south-facing image ID. Reuses its pixels without another image charge.
- `first_frame`: `Base64Image` (nullable) — Encoded south-facing PNG upload; mutually exclusive with source_image_id.
- `description` **(obrigatório)**: string [minLen=1, maxLen=2000]
- `name`: string [maxLen=200] default=`""`
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"`
- `first_frame_direction`: const `south` default=`"south"`
- `seed`: integer [min=0.0] default=`0`
- `image_size`: `ProFlashImageSize` (nullable) — Defaults to 64x64 for text creation. Native sizes: 16x16 (experimental), 24x24, 32x32, 32x48, 48x48, 64x64, 96x64, 96x96, 128x128. Custom size (Beta): integer width 16–256 and height 16–256. Both dimensions…
- `style_image`: `ProFlashReferenceImage` (nullable)
- `style_options`: `ProFlashStyleOptions` (nullable)
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every direction (a first_frame or…
- `n_directions`: integer enum: `1`, `8` default=`8`

**Resposta 202** `CreateObjectProFlashResponse`: `usage`:Usage (nullable), `background_job_id`:string, `object_id`:string, `status`:string, `estimated_generations`:integer, `first_direction_generated`:boolean

---

## Object Library


### `DELETE /objects/{object_id}/animations` — Delete animations from an object

Delete object animations by animation_type or animation_group_id. For objects `animation_type` matches display_name OR animation_name (legacy rows). Same disambiguation rule as characters — pass animation_group_id when a name matches multiple groups.

- **path param** `object_id` (obrigatório): string (uuid)
- **query param** `animation_type`: string (nullable)
- **query param** `animation_group_id`: string (uuid) (nullable)
- **query param** `direction`: string (nullable)

**Resposta 200** `DeleteAnimationResponse`: `usage`:Usage (nullable), `success`:boolean, `deleted_count`:integer, `label`:string (nullable), `error`:string (nullable)

Erros: 400 Neither animation_type nor animation_group_id supplied; 401 Invalid API token; 404 Object not found or not owned by you; 409 animation_type is ambiguous — pass animation_group_id

### `GET /objects` — List user's objects

List all objects created by the authenticated user. This endpoint returns a paginated list of all objects you've created. **Features:** - Pagination support with limit and offset parameters - Preview URLs for quick object identification - Complete object metadata **Authentication:** Requires a valid API token in the Authorization header. **Pagination:** - Use `limit` to control how many objects to return (1-100) - Use `offset` to skip objects for pagination - Total count is included in response for pagination UI

- **query param** `limit`: integer [min=1, max=100] default=`50` — Maximum number of objects to return
- **query param** `offset`: integer [min=0] default=`0` — Number of objects to skip

**Resposta 200** `ObjectsListResponse`: `usage`:Usage (nullable), `objects`:array of ObjectSummary, `total`:integer

Erros: 401 Invalid API token

### `GET /objects/{object_id}` — Get object details

Get detailed information about a specific object. This endpoint returns complete object information including all rotation image URLs and metadata. **Features:** - Complete object information and settings - URLs for all rotation images (4 directions) - Generation parameters used during creation **Authentication:** Requires a valid API token. You can only access objects you created.

- **path param** `object_id` (obrigatório): string (uuid)

**Resposta 200** `ObjectDetail`: `id`:string, `name`:string (nullable), `state_name`:string (nullable), `prompt`:string, `size`:ObjectSize, `directions`:integer, `created_at`:string, `view`:string (nullable), `rotation_urls`:ObjectRotationUrls, `storage_urls`:object, `frame_urls`:array of string (nullable), `style_settings`:object (nullable), `tags`:array of string, `status`:string (nullable), `group_id`:string (nullable), `progress_percent`:integer (nullable), `eta_seconds`:integer (nullable), `animations`:array of ObjectAnimationGroup

Erros: 401 Invalid API token; 403 Object belongs to another user; 404 Object not found

### `DELETE /objects/{object_id}` — Delete an object and all associated data

Delete an object and all its rotation images. This permanently deletes: - The object record from the database - All rotation images from storage - All associated tags **Authentication:** Requires a valid API token. You can only delete objects you created. **Warning:** This action cannot be undone.

- **path param** `object_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteObjectResponse`: `usage`:Usage (nullable), `success`:boolean, `object_id`:string (nullable), `error`:string (nullable)

Erros: 401 Invalid API token; 403 Object belongs to another user; 404 Object not found

### `PATCH /objects/{object_id}/tags` — Update object tags

Update the tags for a specific object. This endpoint replaces all tags for an object with the provided list. Tags are used for filtering and organizing your objects. **Features:** - Replace all tags at once (set operation) - Automatic normalization (trim whitespace) - Case-insensitive duplicate detection - Maximum 20 tags per object - Maximum 50 characters per tag **Authentication:** Requires a valid API token. You can only update tags for objects you created.

- **path param** `object_id` (obrigatório): string (uuid)

**Corpo** (`application/json`, `UpdateObjectTagsRequest`):

- `tags` **(obrigatório)**: array of string [maxItems=20] — List of tags to assign to the object

**Resposta 200** `UpdateObjectTagsResponse`: `usage`:Usage (nullable), `tags`:array of string

Erros: 400 Invalid tag format or validation error; 401 Invalid API token; 403 Object belongs to another user; 404 Object not found

### `GET /objects/{object_id}/spritesheet` — Export object as spritesheet

Download an object as a single spritesheet image plus a layout JSON. The response is a small ZIP holding two files named after the object: - `<name>.png` — one uniform-grid sheet: row 0 is the rotations (in the standard direction order; a single-direction object gets a one-cell row), then one row per animation-direction, columns are frames in playback order. Every cell has the same size (the largest frame on the sheet); frames are centred in their cell and never rescaled, so the object's pivot is always the cell centre. Unused cells are transparent. - `<name>.json` — the layout: cell size, sheet size, column count, and a row-by-row map saying which animation and direction each row shows. **Authentication:** Requires a valid API token. You can only export objects you created. **Status Codes:** - 200: ZIP file (sheet + layout JSON) ready for download - 400: Object has no rotation images yet (still generating or failed) - 401: Invalid API token - 403: Object belongs to another user - 404: Object not found

- **path param** `object_id` (obrigatório): string (uuid)

**Resposta 200** (application/json): ?

**Resposta 200** (application/zip): ?

Erros: 400 Object has no rotation images; 401 Invalid API token; 403 Object belongs to another user; 404 Object not found

---

## Animate


### `POST /animate-with-text-v3` — Animate with text (v3)

Generate an animation from a reference frame and a text action description. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to retrieve results when generation completes. **How it works:** 1. Submit the first frame and action description; receive a `background_job_id` immediately. 2. Poll `GET /v2/background-jobs/{background_job_id}` every 2-5 seconds. 3. When `status` is `completed`, the generated frames are available at `last_response.images`. **Size Limits:** - Maximum image dimension: 256x256 pixels - Total pixel budget: width × height × frame_count ≤ 524,288 **Frame Count Guidelines:** - 4 frames: Simple loops (idle, breathing) - 8 frames: Standard animations (walk, run) - 16 frames: Complex animations (attack combos) Typical generation time: 30-180 seconds.


**Corpo** (`application/json`, `AnimateWithTextV3Request`):

- `first_frame` **(obrigatório)**: `Base64Image` — First frame to animate (PNG/JPEG base64, max 256x256 pixels)
- `last_frame`: `Base64Image` (nullable) — Optional last frame to guide the animation endpoint (PNG/JPEG base64, max 256x256 pixels)
- `action` **(obrigatório)**: string [minLen=1, maxLen=1000] — Action description (e.g., 'walking', 'jumping', 'attacking')
- `frame_count`: integer [min=4.0, max=16.0] default=`8` — Number of animation frames (4-16, must be even)
- `seed`: integer [min=0.0] (nullable) default=`0` — Seed for reproducible generation (0 for random)
- `no_background`: boolean (nullable) — Remove background from generated frames
- `drift_threshold`: number [min=0.0] (nullable) — Color de-flicker sensitivity. Frames whose foreground drifts from the first frame beyond this are corrected toward it; 0 corrects every frame, higher values correct fewer. Omit for the default.
- `enhance_prompt`: boolean default=`false` — If true, automatically expand `action` into a richer motion description before generating — equivalent to calling /v2/enhance-animation-v3-prompt with these frames first. Uses `first_frame` (and `last_frame`…

**Resposta 200** `AnimateWithTextV3Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent background jobs

### `POST /animate-pixminimax` — Animate with text (PixMiniMax)

Beta. Generate an animation from a frame and a text description of the motion. Powered by MiniMax H3. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to retrieve results when generation completes. **How it works:** 1. Submit the first frame and motion description; receive a `background_job_id` immediately. 2. Poll `GET /v2/background-jobs/{background_job_id}` every 2-5 seconds. 3. When `status` is `completed`, `last_response.images` holds `frame_count + 1` frames: index 0 is your input frame unchanged, then the generated frames. **Size Limits:** - Maximum image dimension: 256x256 pixels - Frame count: multiples of 4, from 4 to 40 at any size up to 256x256 **Prompt enhancement:** set `enhance_prompt: true` to have a short description ("shooting a bow") expanded into a detailed PixMiniMax motion prompt first; add `direction` to hold the sprite's facing and aim attacks that way. The expanded text comes back in `enhanced_prompt` (+0.05 generations). **Caption fields:** `subject_description`, `initial_pose`, `view` and `direction` describe the first…


**Corpo** (`application/json`, `AnimatePixminimaxRequest`):

- `first_frame` **(obrigatório)**: `Base64Image` — Frame to animate (PNG base64, max 256x256).
- `last_frame`: `Base64Image` (nullable) — Optional end pose, same size as first_frame — the motion is generated between the two.
- `description` **(obrigatório)**: string [minLen=1, maxLen=1000] — The motion to generate (e.g. 'walking forward', 'sword slash', 'flame flickering'). Describe movement, not appearance.
- `frame_count`: integer default=`8` — Frames to generate, a multiple of 4 from 4 to 40, at any size up to 256x256.
- `seed`: integer [min=0.0] (nullable) default=`0` — Seed for reproducible generation (0 = random)
- `no_background`: boolean default=`true` — True returns the frames on transparency; an opaque input is cut out of its first frame before animating. False keeps an opaque backdrop.
- `drift_threshold`: number [min=0.0] (nullable) — Color de-flicker sensitivity. Frames whose foreground drifts from the first frame beyond this are corrected toward it; 0 corrects every frame, higher values correct fewer. Omit for the default.
- `enhance_prompt`: boolean default=`false` — If true, rewrite `description` as PixMiniMax's action caption before generating: the motion in playback order with weight, follow-through and recovery, and nothing about appearance, pose, view or facing (those…
- `direction`: string enum: `south`, `north`, `east`, `west`, `south-east`, `south-west`, `north-east`, `north-west` (nullable) — Facing direction of the sprite (south = towards the camera), the model's facing caption field. Omit to have it read from the image.
- `view`: string enum: `low top-down`, `high top-down`, `side` (nullable) — Camera view of the sprite, the model's view caption field. Omit to have it read from the image.
- `subject_description`: string [minLen=1, maxLen=300] (nullable) — What first_frame shows, one noun phrase (e.g. 'a knight in silver plate armour'), the model's subject caption field. Omit to have it read from the image.
- `initial_pose`: string [minLen=1, maxLen=300] (nullable) — The pose first_frame is in (e.g. 'standing upright with the sword lowered'), the model's starting-pose caption field. Omit to have it read from the image.

**Resposta 200** `AnimatePixminimaxResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string, `enhanced_prompt`:string (nullable), `enhance_usage`:Usage (nullable)

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent background jobs

### `POST /interpolation-v2` — Interpolate (Pro)

Generate intermediate animation frames between two keyframe images. This endpoint creates smooth transitions between a start and end image, generating intermediate frames that animate the transformation. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Generates intermediate frames between two keyframes - Text-guided interpolation with action descriptions - Maintains visual consistency across frames - Optional background removal - Non-blocking: returns job ID immediately **Example Actions:** - "morphing" - "transforming into a werewolf" - "powering up with energy" - "dissolving into particles" - "walking forward" **Output:** - Returns multiple interpolated frames (typically 4-8 frames) **Supported Sizes:** - Frame sizes from 16x16 to 128x128 pixels **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, interpolated frames are in `last_response`


**Corpo** (`application/json`, `InterpolationV2Request`):

- `start_image` **(obrigatório)**: `KeyframeImage` — Starting keyframe image
- `end_image` **(obrigatório)**: `KeyframeImage` — Ending keyframe image
- `action` **(obrigatório)**: string [minLen=1, maxLen=500] — Description of the transition (e.g., 'morphing', 'transforming', 'powering up')
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__interpolation_v2__ImageSize` — Size of the output frames
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`true` — Remove background from output frames
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every frame (one choice for all…

**Resposta 202** `InterpolationV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /edit-animation-v2` — Edit animation (Pro)

Edit multiple animation frames with a text description. This endpoint applies a consistent edit across all animation frames, maintaining temporal coherence while transforming the animation. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Apply text-based edits to animation sequences - Maintains frame-to-frame consistency - Supports 2-16 frames per request (max depends on frame size, see below) - Optional background removal - Non-blocking: returns job ID immediately **Example Edits:** - "add a red cape" - "make it glow blue" - "add armor plating" - "change to ice theme" **Supported Sizes:** - Frame sizes from 16x16 to 256x256 pixels (model supports up to 256x256) **Frame limits by output size (image_size):** - 16-64px: Up to 16 frames (4x4 grid) - 65-80px: Up to 9 frames (3x3 grid) - 81-256px: Up to 4 frames (2x2 grid) All frames are packed into a single grid image for editing, so larger frames fill the fixed generation canvas faster and fewer fit per request. **Usage Pattern:** 1. POST to…


**Corpo** (`application/json`, `EditAnimationV2Request`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the edit to apply (e.g., 'add a red cape', 'make it glow blue')
- `frames` **(obrigatório)**: array of `app__endpoints__external__v2__edit_animation_v2__FrameImage` [minItems=2, maxItems=16] — Animation frames to edit (2-16 frames)
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__edit_animation_v2__ImageSize` — Size of the output frames
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`false` — Remove background from edited frames
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every frame (one choice for all…

**Resposta 202** `EditAnimationV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /transfer-outfit-v2` — Transfer outfit (Pro)

Transfer an outfit/appearance from a reference image to animation frames. This endpoint takes a reference image containing a desired outfit or appearance and applies it consistently across multiple animation frames. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Transfer outfit/appearance from reference to animation - Maintains animation motion while changing appearance - Supports 2-16 frames per request (max depends on frame size, see below) - Optional background removal - Non-blocking: returns job ID immediately **Use Cases:** - Apply armor/clothing to walking animation - Change character skin/color across animation - Transfer weapon or equipment to action sequence - Consistent reskin of sprite animations **Supported Sizes:** - Frame sizes from 32x32 to 256x256 pixels **Frame limits by output size (image_size):** - 32-64px: Up to 15 frames (4x4 grid) - 65-80px: Up to 8 frames (3x3 grid) - 81-256px: Up to 3 frames (2x2 grid) The reference image and all frames are packed into a single…


**Corpo** (`application/json`, `TransferOutfitV2Request`):

- `reference_image` **(obrigatório)**: `app__endpoints__external__v2__transfer_outfit_v2__ReferenceImage` — Reference image containing the outfit/appearance to transfer
- `frames` **(obrigatório)**: array of `app__endpoints__external__v2__transfer_outfit_v2__FrameImage` [minItems=2, maxItems=16] — Animation frames to apply the outfit to (2-16 frames)
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__transfer_outfit_v2__ImageSize` — Size of the output frames
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`false` — Remove background from output frames
- `additional_instructions`: string [maxLen=2000] (nullable) default=`""` — Optional free-text instructions to guide the transfer (e.g. view/direction hints like 'frames show the character from behind')
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every frame (one choice for all…

**Resposta 202** `TransferOutfitV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /animate-with-text-v2` — Animate with text (pro)

Generate pixel art animation from text. This endpoint creates animations from a reference image and action description. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Text-guided animation generation - Optional colour palette (`target_palette`, beta): 2-256 hex colours; the reference is put on the palette first and every frame uses only these colours. `max_colors` caps the whole animation - Automatic background removal - Non-blocking: returns job ID immediately **Frame Counts by Size:** - 32x32 pixels: Returns 16 animation frames - 64x64 pixels: Returns 16 animation frames - 128x128 pixels: Returns 4 animation frames - 170x170 pixels: Returns 4 animation frames - 256x256 pixels: Returns 4 animation frames **Supported Actions:** - Simple actions: walk, run, jump, attack - Complex actions: cast spell, dance, celebrate - Any action description in natural language **Camera Views:** - `none`: No camera hint (default) - `low top-down`: Classic 3/4 RPG view (~20 degrees from horizontal) - `high…


**Corpo** (`application/json`, `AnimateWithTextV2Request`):

- `reference_image` **(obrigatório)**: `Base64Image` — Reference image (character/object to animate) as base64 PNG/JPEG
- `reference_image_size` **(obrigatório)**: `app__endpoints__external__v2__animate_with_text_v2__ReferenceImageSize` — Size of the reference image
- `action` **(obrigatório)**: string [minLen=1, maxLen=500] — Action description (e.g., 'walk', 'jump', 'attack')
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__animate_with_text_v2__ImageSize` — Size of each animation frame
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation (0 for random)
- `no_background`: boolean (nullable) default=`true` — Remove background from generated frames
- `view`: string enum: `none`, `low top-down`, `high top-down`, `side` default=`"none"` — Camera perspective angle. ('none', 'low top-down', 'high top-down', 'side')
- `direction`: string enum: `none`, `south`, `east`, `west`, `north`, `south-east`, `south-west`, `north-east`, `north-west` default=`"none"` — Direction the character faces during the animation.
- `target_palette`: `TargetPalette` (nullable) — Colours the frames must use and/or a colour cap, shared by all frames: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. The reference image is put on the palette…

**Resposta 202** `AnimateWithTextV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /animate-with-text` — Animate with text

Creates a pixel art animation based on text description and parameters. Supported image sizes: - 64x64 Supported features: - Text-guided animation generation - Inpainting - Init image - Forced palette - Multiple frames


**Corpo** (`application/json`, `AnimateWithTextRequest`):

- `image_size` **(obrigatório)**: `app__endpoints__external__v2__animate_with_text__ImageSize`
- `description` **(obrigatório)**: string — Character description
- `negative_description`: string default=`""` — Negative prompt to guide what not to generate
- `action` **(obrigatório)**: string — Action description
- `text_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`8.0` — How closely to follow the text prompts
- `image_guidance_scale`: number [min=1.0, max=20.0] (nullable) default=`1.4` — How closely to follow the reference image
- `n_frames`: integer [min=2.0, max=20.0] (nullable) default=`4` — Length of full animation (the model will always generate 4 frames)
- `start_frame_index`: integer [min=0.0, max=20.0] (nullable) default=`0` — Starting frame index of the full animation
- `view`: `CameraView` default=`"side"` — Camera view angle
- `direction`: `Direction` default=`"east"` — Subject direction
- `init_images`: array of `Base64Image` (nullable) — Initial images to start the generation from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `reference_image` **(obrigatório)**: `Base64Image` — Reference image
- `inpainting_images`: array of `Base64Image` (nullable) default=`[null, null, null, null]` — Existing animation frames to guide the generation
- `mask_images`: array of `Base64Image` (nullable) (nullable) default=`[null, null, null, null]` — Inpainting / mask image (black and white image, where the white is where the model should inpaint)
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) default=`0` — Seed for reproducible results (0 for random)

**Resposta 200** `AnimateWithTextResponse`: `usage`:Usage (nullable), `images`:array of Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

---

## Skeleton Animation


### `POST /estimate-skeleton` — Estimate skeleton

Estimates the skeleton of a character, returning a list of keypoints to use with the skeleton animation tool. Any image size up to 256x256 works. The model runs on 16/32/64/128/256 squares, so an image of another size is padded to the next one that fits and the returned coordinates are converted back — `x`/`y` are fractions 0-1 of the image YOU sent, not of the padded square, so they can be passed straight to the skeleton animation endpoints. A 40x40 or 56x56 sprite therefore needs no padding from you. Cost: 0.1 generations per call. A fully transparent image is refused (422) before it is charged, since there is no character to estimate from.


**Corpo** (`application/json`, `EstimateSkeletonRequest`):

- `image`: `Base64Image` — Image for which to estimate the skeleton

**Resposta 200** `EstimateSkeletonResponse`: `usage`:Usage (nullable), `keypoints`:array of Keypoint-Output

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `POST /animate-with-skeleton-v3` — Animate with skeleton v3

Beta. Animate a sprite by posing it: one skeleton per frame, drawn from a single reference image. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to retrieve results when generation completes. **How it works:** 1. Send the sprite, the skeleton of the pose it is already in (`first_frame_keypoints`), and one skeleton per frame you want (`keypoints`). 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds. 3. When `status` is `completed`, `last_response.images` holds exactly `len(keypoints)` frames, each the size of `first_frame`. The reference frame is not returned. **Skeletons:** 18 humanoid joints, `x`/`y` as fractions 0-1 of the image. `depth` is optional -- leave it out and it is taken from the standing pose of `template_id` for your direction, which is what an editor without 3D data should do. `POST /v2/estimate-skeleton` will derive a skeleton from an image if you do not have one — it returns x/y on the same 0-1 scale as this endpoint expects, so the result drops straight into `keypoints`. **Limits:** 3-15 frames, canvas up…


**Corpo** (`application/json`, `AnimateWithSkeletonV3Request`):

- `description` **(obrigatório)**: string [minLen=1] — What the character LOOKS like, as a noun phrase: 'blonde vampire with a red cape'. Colours, clothing, held items. Not the pose, motion, style or background -- those belong in `action` or in the skeletons.
- `action` **(obrigatório)**: string [minLen=1] — The motion's short label: 'walk', 'run', 'attack'.
- `direction` **(obrigatório)**: `Direction` — The direction the character faces.
- `view`: `CameraView` default=`"low top-down"` — Camera angle.
- `first_frame` **(obrigatório)**: `Base64Image` — The sprite to animate, PNG base64, up to 256x256. Frames come back at this size.
- `first_frame_keypoints` **(obrigatório)**: array of `Keypoint-Input` — The skeleton of the pose `first_frame` is IN, all 18 joints. The model redraws this frame first and learns the background key and the colours from that redraw, so a skeleton that does not match the image…
- `keypoints` **(obrigatório)**: array of array of `Keypoint-Input` — The motion: one skeleton per frame you get back, all 18 joints each. 3 to 15 frames.
- `template_id`: string enum: `mannequin`, `bear`, `cat`, `dog`, `horse`, `lion` default=`"mannequin"` — The body a joint's missing `depth` is taken from: mannequin, bear, cat, dog, horse or lion. A quadruped posed with mannequin depth comes out flat.
- `seed`: integer [min=0.0] default=`0` — 0 for a random seed.
- `no_background`: boolean default=`true` — Return frames with a transparent background.

**Resposta 200** `AnimateWithSkeletonV3Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent background jobs

### `POST /animate-with-skeleton` — Animate with skeleton

Creates a pixel art animation based on the provided parameters. Called "Animate with skeleton" in the plugin. Supported image sizes: - 16x16 - 32x32 - 64x64 - 128x128 - 256x256 Supported features: - Inpainting - Init image - Forced palette


**Corpo** (`application/json`, `AnimateWithSkeletonRequest`):

- `image_size` **(obrigatório)**: `app__endpoints__external__v2__animate_with_skeleton__ImageSize`
- `guidance_scale`: number [min=1.0, max=20.0] default=`4.0` — How closely to follow the reference image and skeleton keypoints
- `view`: `CameraView` default=`"side"` — Camera view angle
- `direction`: `Direction` default=`"east"` — Subject direction
- `isometric`: boolean default=`false` — Generate in isometric view
- `oblique_projection`: boolean default=`false` — Generate in oblique projection
- `init_images`: array of `Base64Image` (nullable) — Initial images to start the generation from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `skeleton_keypoints`: array of array of `Point` — Skeleton pose keypoints. Requires EXACTLY 3 frames — the model is a 3-frame window; other counts are rejected with a 422.
- `reference_image` **(obrigatório)**: `Base64Image` — Reference image
- `inpainting_images`: array of `Base64Image` (nullable) default=`[null, null, null]` — Images used for showing the model with connected skeleton
- `mask_images`: array of `Base64Image` (nullable) — Inpainting / mask image (black and white image, where the white is where the model should inpaint)
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 200** `AnimateWithSkeletonResponse`: `usage`:Usage (nullable), `images`:array of Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

---

## VFX


### `POST /vfx` — Create VFX

Our effects artist makes an animated pixel art effect from your description: explosions, slashes, auras, spells, fire, smoke, lightning, hits, pickups. The same artist as the website's VFX creator. It builds the effect from parts, renders it and checks its own work, around your sprite when you send one. The effect is saved to your My effects, so you can open it on the website (`edit_url`) and tweak it with sliders, or change it here with `effect_id`. **Using an AI agent? We recommend the MCP** ([pixellab.ai/mcp](https://pixellab.ai/mcp)): there your agent is the artist. `vfx_workbench` builds, renders and saves the effect with your agent's own model, free for subscribers, and your agent sees every frame. ### Result Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds (usually 30-90 s). When `status` is `completed`, `last_response` has: - `files`: download links (no auth needed): `<name>.gif`, the spritesheet `<name>.png` + `<name>.json` (frames, durations, `pivot` and `meta.anchor`: where the effect's anchor is), `<name>-game.zip` with `game_pack`, and…


**Corpo** (`application/json`, `VfxRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=8000] — The effect in plain words, as you would ask an effects artist: what it is, its colours, how it moves, how long. With `effect_id`, what to change.
- `sprite`: `Base64Image` (nullable) — Optional: your character or object, base64 PNG or GIF, up to 512x512 per frame. The effect is made around it (a hit lands on it, an aura wraps it, a light shades it). An animation is a GIF or a horizontal…
- `sprite_frames`: integer [min=1.0, max=32.0] default=`1` — How many equal frames the sprite's PNG strip holds (1-32). Leave at 1 for a GIF: its own frames are used.
- `sprite_fps`: integer [min=1.0, max=60.0] (nullable) — How fast the sprite's animation plays. Default: a GIF's own timing, else 12.
- `artist`: string enum: `lite`, `pro` default=`"lite"` — lite (recommended): good for most effects, and cheap (1 generation for most). pro: for very detailed effects, at a higher price (see Cost).
- `effect_id`: string (uuid) (nullable) — Change one of your saved effects (a previous result's `effect_id`, or one from the website's My effects). It is saved over in place and keeps its own sprite.
- `conversation`: string (nullable) — The `conversation` of the previous result, with its `effect_id`: the change is then priced as a change, not a new effect.
- `name`: string [maxLen=80] (nullable) — The effect's name in My effects and in the file names. Default: the artist's or the description's first words.
- `game_pack`: boolean default=`false` — Also make the game pack ZIP: one spritesheet per piece (the whole effect, behind and in front of the sprite, each part) + manifest.json with where each goes. Adds a few seconds.

**Resposta 202** `VfxResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string, `quoted_generations`:integer

Erros: 400 A request to change (the detail says what); 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs; 503 The renderer is busy; retry in a few seconds

---

## Rotate


### `POST /generate-8-rotations-v3` — Generate 8 rotations (v3)

Generate 8 directional rotations from a reference frame. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to retrieve results when generation completes. **How it works:** 1. Submit the reference frame; receive a `background_job_id` immediately. 2. Poll `GET /v2/background-jobs/{background_job_id}` every 2-5 seconds. 3. When `status` is `completed`, the 8 rotation frames are available at `last_response.images`. **Size Limits:** - Maximum image dimension: 256x256 pixels Typical generation time: 30-180 seconds.


**Corpo** (`application/json`, `Generate8RotationsV3Request`):

- `first_frame` **(obrigatório)**: `Base64Image` — Reference frame to generate 8 rotations from (PNG/JPEG base64, max 256x256 pixels)
- `description`: string [maxLen=2000] (nullable) — Optional description of the subject in the reference frame, used to improve rotation consistency. The subject is always analyzed from the reference frame; this text is taken into account as an extra hint.
- `no_background`: boolean (nullable) — Remove background from generated frames
- `seed`: integer [min=0.0] (nullable) default=`0` — Seed for reproducible generation (0 for random)

**Resposta 200** `Generate8RotationsV3Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent background jobs

### `POST /generate-8-rotations-v2` — Generate 8 rotations (Pro)

Generate 8 rotational views of a character or object. This endpoint creates 8 directional views from a reference image, useful for game sprites that need to face multiple directions. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Methods:** - **rotate_character**: Rotate existing sprite to 8 directions (`reference_image`) - **create_with_style**: Create new character from description (requires `description`) - **create_from_concept**: Create rotations from concept art (requires `concept_image`) **Output:** Returns 8 images in order: South, South-West, West, North-West, North, North-East, East, South-East **View Angles:** - `low top-down`: ~20 degree angle (most common for RPGs) - `high top-down`: ~35 degree angle - `side`: Side-scroller eye level **Supported Sizes:** - image_size: 32x32 to 168x168 (matches reference_to_8_rotations). reference_image max 168x168, concept_image max 1024x1024. **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET…


**Corpo** (`application/json`, `Generate8RotationsV2Request`):

- `method`: string enum: `rotate_character`, `create_with_style`, `create_from_concept` default=`"rotate_character"` — Generation method: 'rotate_character' rotates an existing character, 'create_with_style' creates new character matching style, 'create_from_concept' creates from concept art
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__generate_8_rotations_v2__ImageSize` — Size of the output images
- `reference_image`: `app__endpoints__external__v2__generate_8_rotations_v2__ReferenceImage` (nullable) — Image to rotate (rotate_character) or style reference
- `concept_image`: `app__endpoints__external__v2__generate_8_rotations_v2__ReferenceImage` (nullable) — Concept art image (only for create_from_concept method)
- `description`: string [maxLen=2000] (nullable) — Description of the character/item
- `style_description`: string [maxLen=500] (nullable) — Description of the visual style
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"` — Camera perspective angle
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`true` — Remove background from generated images
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of all 8 directions is one of them;…

**Resposta 202** `Generate8RotationsV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /rotate` — Rotate character or object

Rotates a pixel art image based on the provided parameters. Called "Rotate" in the plugin. Supported image sizes: - 16x16 - 32x32 - 64x64 - 128x128 Supported features: - Init image - Forced palette


**Corpo** (`application/json`, `RotateRequest`):

- `image_size` **(obrigatório)**: `app__endpoints__external__v2__rotate__ImageSize`
- `image_guidance_scale`: number [min=1.0, max=20.0] default=`3.0` — How closely to follow the reference image
- `view_change`: integer [min=-90.0, max=90.0] (nullable) — How many degrees to tilt the subject
- `direction_change`: integer [min=-180.0, max=180.0] (nullable) — How many degrees to rotate the subject
- `from_view`: `CameraView` (nullable) default=`"side"` — From camera view angle
- `to_view`: `CameraView` (nullable) default=`"side"` — To camera view angle
- `from_direction`: `Direction` (nullable) default=`"south"` — From subject direction
- `to_direction`: `Direction` (nullable) default=`"east"` — From subject direction
- `isometric`: boolean default=`false` — Generate in isometric view
- `oblique_projection`: boolean default=`false` — Generate in oblique projection
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `mask_image`: `Base64Image` (nullable) — Inpainting / mask image. Requires init image! (black and white image, where the white is where the model should inpaint)
- `from_image` **(obrigatório)**: `Base64Image` — Reference image to rotate
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 200** `RotateResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

---

## Edit


### `POST /edit-images-v2` — Edit images (Pro)

Edit pixel art images using text or reference image. This endpoint supports two editing methods: 1. **edit_with_text**: Apply edits based on a text description 2. **edit_with_reference**: Match the style of a reference image Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Output sizes (image_size):** - **Range:** 32x32 to 512x512 pixels. Each returned image has the dimensions you set in `image_size`. - Input images (`edit_images`, `reference_image`) must be at most 512x512 each. **Key Features:** - Edit multiple images consistently - Text-guided or reference-guided editing - Preserves original structure and poses - Optional background removal - Non-blocking: returns job ID immediately **Frame limits by output size (image_size):** - 32-64px: Up to 16 frames (4x4 grid), 15 with reference - 65-80px: Up to 9 frames (3x3 grid), 8 with reference - 81-128px: Up to 4 frames (2x2 grid), 3 with reference - 129-512px: 1 frame (both methods) **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2.…


**Corpo** (`application/json`, `EditImagesV2Request`):

- `method`: string enum: `edit_with_text`, `edit_with_reference` default=`"edit_with_text"` — Edit method: 'edit_with_text' or 'edit_with_reference'
- `edit_images` **(obrigatório)**: array of `EditImage` [minItems=1, maxItems=16] — Images to edit (1-16 images depending on size)
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__edit_images_v2__ImageSize` — Size of output images
- `description`: string [minLen=1, maxLen=2000] (nullable) — Edit description (required for edit_with_text method)
- `reference_image`: `app__endpoints__external__v2__edit_images_v2__ReferenceImage` (nullable) — Reference image (required for edit_with_reference method)
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`false` — Remove background from edited images

**Resposta 202** `EditImagesV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /edit-image-pixen` — Edit image (pixen)

Edit an existing pixel art image with a text instruction, on the Pixen model. Returns YOUR image edited — pose, composition and pixel style are preserved and only what you asked for changes. Returns immediately with a background job ID; poll `GET /v2/background-jobs/{job_id}` to check status and retrieve the result. ### Sizes The two canvases are bounded differently, both enforced here so an oversized request costs nothing instead of failing on a worker. - **Source image**: max **256px per side** (a hard model limit) and area at least 16x16. Crop an oversized source — do not rescale pixel art, it destroys the pixel grid. - **Target canvas**: area **16x16 to 256x256** (65,536px). This is an area, so a wide-but-short canvas like 128x512 is fine. Defaults to the source image's size. The model re-renders at the target size rather than rescaling, so the source and the result may legitimately differ in size. - **Both canvases**: every side a **multiple of 4**. A 63x222 sprite is rejected with the aligned size to use (64x224) — pad it with transparent pixels, never rescale pixel art. ###…


**Corpo** (`application/json`, `EditImagePixenRequest`):

- `image` **(obrigatório)**: `Base64Image` — The image to edit, as base64 PNG. Each side must be 256px or smaller and a multiple of 4, and the area at least 16x16. Pad with transparent pixels to align — never rescale pixel art.
- `description` **(obrigatório)**: string [minLen=1, maxLen=500] — What to change (e.g. 'give him a red cape', 'make the armor gold')
- `width`: integer [min=1.0] (nullable) — Target canvas width, a multiple of 4. Area must be at most 256x256. Defaults to the source image's width. The model re-renders at this size — it does not rescale.
- `height`: integer [min=1.0] (nullable) — Target canvas height, a multiple of 4. Defaults to the source image's height.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean default=`true` — Return the result on a transparent background

**Resposta 202** `EditImagePixenResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 400 Image or canvas outside the supported sizes; 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /edit-image` — Edit image

Edit an existing pixel art image based on a text description. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. ### Supported Image Sizes - **Reference image**: 16x16 to 400x400 pixels (minimum 16x16 area) - **Target canvas**: 16x16 to 400x400 pixels (minimum 16x16 area) - **Free tier limit**: Maximum 200x200 pixels for target canvas ### Output Returns a single edited image matching the target canvas dimensions. ### Usage Pattern 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, edited image is in `last_response`


**Corpo** (`application/json`, `EditImageRequest`):

- `image` **(obrigatório)**: `Base64Image` — Reference image to edit as base64 PNG/JPEG
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__edit_image__ImageSize` — Size of the reference image
- `description` **(obrigatório)**: string [minLen=1, maxLen=500] — Text description of the edit to apply
- `width` **(obrigatório)**: integer [min=16.0, max=400.0] — Target canvas width in pixels (16-400)
- `height` **(obrigatório)**: integer [min=16.0, max=400.0] — Target canvas height in pixels (16-400)
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation (0 for random)
- `no_background`: boolean (nullable) default=`true` — Generate with transparent background
- `text_guidance_scale`: number [min=1.0, max=10.0] (nullable) default=`8.0` — How closely to follow the text description (1.0-10.0)
- `color_image`: `Base64Image` (nullable) — Color reference image for style guidance

**Resposta 202** `EditImageResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /edit-image-pro-flash` — Edit image (Pro Flash)

Edit one image at a supported native size using an instruction or reference. Query /v2/pro-flash/capabilities for exact native shapes. The source canvas never grows or resizes. Reference art must fit the source canvas. Poll /v2/background-jobs/{background_job_id}, then use its image_url or download.


**Corpo** (`application/json`, `EditImageProFlashRequest`):

- `image` **(obrigatório)**: `Base64Image`
- `method`: string enum: `text`, `reference` default=`"text"`
- `description`: string [maxLen=2000] (nullable)
- `reference_image`: `Base64Image` (nullable)
- `no_background`: boolean default=`false`
- `use_color_palette_correction`: boolean default=`false`
- `seed`: integer [min=0.0] default=`0`
- `project_id`: string (uuid) (nullable)

**Resposta 202** `ProFlashImageResponse`: `usage`:Usage (nullable), `background_job_id`:string, `image_id`:string, `source_image_id`:string, `status`:string, `output_count`:integer, `image_size`:ProFlashImageSize, `estimated_generations`:integer, `pricing_provisional`:boolean

---

## Inpaint


### `POST /inpaint-v3` — Inpaint image (Pro)

Inpaint/edit pixel art images using AI. This endpoint uses AI-powered inpainting for high-quality results. It allows you to edit specific areas of an image based on a text description. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - AI-powered inpainting with text descriptions - Optional context image for style guidance - Bounding box support for precise editing - Background removal option - Mask-based editing (white = generate, black = preserve) - Non-blocking: returns job ID immediately **Image Sizes:** - Inpainting image: 32x32 to 512x512 pixels - Context image: up to 1024x1024 pixels (optional) **Mask Format:** - White pixels = areas to generate/replace - Black pixels = areas to preserve **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, inpainted image is in `last_response`


**Corpo** (`application/json`, `InpaintV3Request`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of what to generate in the masked area
- `inpainting_image` **(obrigatório)**: `InpaintImage` — Image to inpaint (32x32 to 512x512)
- `mask_image` **(obrigatório)**: `InpaintImage` — Mask for the image (same dimensions as inpainting_image). White = generate, Black = preserve
- `context_image`: `InpaintImage` (nullable) — Context image (deprecated)
- `bounding_box`: `BoundingBox` (nullable) — Bounding box (deprecated)
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`false` — Remove background from generated content
- `crop_to_mask`: boolean (nullable) default=`true` — Whether to crop generated content to mask boundary (ensures clean edges)

**Resposta 202** `InpaintV3Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /inpaint` — Inpaint image

Creates a pixel art image based on the provided parameters. Called "Inpaint" in the plugin. Supported image size: - Maximum area 200x200 Supported features: - Inpainting - Init image - Forced palette - Transparent background


**Corpo** (`application/json`, `InpaintRequest`):

- `description` **(obrigatório)**: string — Text description of the image to generate
- `negative_description`: string default=`""` — Text description of what to avoid in the generated image
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__inpaint__ImageSize`
- `text_guidance_scale`: number [min=1.0, max=10.0] default=`3.0` — How closely to follow the text description
- `extra_guidance_scale`: number [min=0.0, max=20.0] default=`3.0` — (Deprecated)
- `outline`: `Outline` (nullable) — Outline style reference
- `shading`: `Shading` (nullable) — Shading style reference
- `detail`: `Detail` (nullable) — Detail style reference
- `view`: `CameraView` (nullable) — Camera view angle
- `direction`: `Direction` (nullable) — Subject direction
- `isometric`: boolean default=`false` — Generate in isometric view
- `oblique_projection`: boolean default=`false` — Generate in oblique projection
- `no_background`: boolean default=`false` — Generate with transparent background
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `inpainting_image` **(obrigatório)**: `Base64Image` — Reference image which is inpainted
- `mask_image` **(obrigatório)**: `Base64Image` — Inpainting / mask image. (black and white image, where the white is where the model should inpaint).
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 200** `InpaintResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `POST /inpaint-image-pro-flash` — Inpaint image (Pro Flash)

Replace only white mask pixels, preserving unmasked RGBA exactly. Source and mask must have identical supported native dimensions. Mask RGB must be pure black/white; alpha does not change mask meaning. Empty masks are rejected. Changes-only outputs are transparent outside the mask; Modify current layer returns the full composite. Optional native context requires its source bounding_box. Poll the returned background job.


**Corpo** (`application/json`, `InpaintImageProFlashRequest`):

- `image` **(obrigatório)**: `Base64Image`
- `mask_image` **(obrigatório)**: `Base64Image`
- `description` **(obrigatório)**: string [minLen=1, maxLen=2000]
- `context_image`: `Base64Image` (nullable)
- `bounding_box`: `ProFlashBoundingBox` (nullable)
- `no_background`: boolean default=`false`
- `background_removal_task`: string enum: `remove_simple_background`, `remove_complex_background` default=`"remove_simple_background"`
- `output_method`: string enum: `New layer with changes`, `Modify current layer, only changes`, `Modify current layer` default=`"Modify current layer"`
- `crop_to_mask`: const `True` default=`true`
- `seed`: integer [min=0.0] default=`0`
- `project_id`: string (uuid) (nullable)

**Resposta 202** `ProFlashImageResponse`: `usage`:Usage (nullable), `background_job_id`:string, `image_id`:string, `source_image_id`:string, `status`:string, `output_count`:integer, `image_size`:ProFlashImageSize, `estimated_generations`:integer, `pricing_provisional`:boolean

---

## Tilesets


### `POST /tilesets` — Create a tileset · alias of /create-tileset

Creates a Wang tileset (16 tiles for standard, 25 for transition_size=1.0) in the background and returns immediately with job ID


**Corpo** (`application/json`, `CreateTilesetRequest`):

- `lower_description` **(obrigatório)**: string [minLen=1] — Description of the lower/base terrain level (e.g., 'ocean', 'grass', 'lava')
- `upper_description` **(obrigatório)**: string [minLen=1] — Description of the upper/elevated terrain level (e.g., 'sand', 'stone', 'snow')
- `transition_description`: string default=`""` — Optional description of transition area between lower and upper
- `lower_base_tile_id`: string (nullable) — Optional ID to identify the lower base tile in metadata
- `upper_base_tile_id`: string (nullable) — Optional ID to identify the upper base tile in metadata
- `tile_size`: `TileSize` default=`{"width": 16, "height": 16}` — Size of individual tiles within the tileset
- `mode`: string enum: `standard`, `pro` default=`"standard"` — Generation pipeline. "standard": the website's standard tileset (pixen, 16 or 32px tiles, round borders unless shape_style='square'), cheap and fast. "pro": the richest tiles - painted texture, raised banks -…
- `shape_style`: string enum: `square`, `round` (nullable) — Procedural boundary geometry for mode='standard'; 'round' when omitted, as on the website. mode='standard' ONLY — passing it with mode='pro' is rejected (pro's own shape controls are raggedness, roundness,…
- `enhance`: boolean default=`true` — Standard tilesets only (on by default; pro ignores it). AI-enhances the terrain descriptions at the chosen detail/shading levels and picks matching base colours before generation. The stored tileset keeps the…
- `spread_x`: number [min=0.0, max=1.0] default=`0.5` — No effect - the Pro pipeline no longer uses it; kept so existing calls work.
- `slope_size`: number [min=0.0, max=1.0] default=`0.0` — No effect - the Pro pipeline no longer uses it; kept so existing calls work.
- `raggedness`: number [min=0.0, max=1.0] default=`0.0` — Pro only. Terrain boundary noise (0=smooth, 1=rough). Tall sets (transition_size above 0.4) are half as rough.
- `roundness`: number [min=0.0, max=2.0] (nullable) — mode='pro' or shape_style only. Corner shape of the border between the two terrains: 0 = square, 1 = round, 2 = corners cut at 45 degrees (values in between blend). Above 1 needs mode='pro'. Omit for the…
- `boundary_amplitude`: number [min=0.0, max=0.3] default=`0.0` — Uneven boundary: mode='pro' (any transition_size), or standard with transition_size up to 0.5. How far the border between the terrains meanders instead of running straight, 0 = straight (default) to 0.3 = the…
- `boundary_seed`: integer [min=0.0] default=`0` — Boundary shape for boundary_amplitude: another number gives a different meander at the same amount; the same number gives the same shape.
- `step_slope`: number [min=0.0, max=2.0] default=`0.0` — Edge steepness: mode='pro' with transition_size 0.25 only (a raised 16-tile set). How the bank between the terrains falls: 0 = a cliff, straight down (default), up to 2.0 = a gentle slope spread over more…
- `connect_diagonals`: boolean default=`false` — mode='pro' only. The two diagonal tiles (upper terrain in opposite corners): true joins the two upper corners through the middle into one area; false (default) leaves the lower terrain running between them. On…
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `outline`: `Outline` (nullable) — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `shading`: `Shading` (nullable) — Shading style reference
- `detail`: `Detail` (nullable) — Detail style reference
- `view`: `TilesetCameraView` default=`"high top-down"` — Camera view angle, honoured by mode='pro'. Standard (pixen) always draws high top-down.
- `tile_strength`: number [min=0.1, max=2.0] default=`1.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `tileset_adherence_freedom`: number [min=0.0, max=900.0] default=`500.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `tileset_adherence`: number [min=0.0, max=500.0] default=`100.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `transition_size`: number [min=0.0, max=1.0] default=`0.0` — Size of transition area. Pro accepts 0, 0.25, 0.5, or 1.0. Standard accepts any value from 0 to 1; values above 0.5 use the extended 4x8 layout, which needs 16px tiles. Pro reads it as the HEIGHT of the upper…
- `lower_reference_image`: `Base64Image` (nullable) — Reference image for lower terrain style
- `upper_reference_image`: `Base64Image` (nullable) — Reference image for upper terrain style
- `transition_reference_image`: `Base64Image` (nullable) — Reference image for transition area style
- `color_image`: `Base64Image` (nullable) — No effect on standard (pixen picks its own colours); for pro, use target_palette.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the tileset (mode='pro' only) is one…
- `seed`: integer (nullable) — Seed for reproducible generation

**Resposta 202** `CreateTilesetBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `tileset_id`:string, `status`:const processing

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `GET /tilesets` — List user's tilesets

List all tilesets (top-down and sidescroller) created by the authenticated user. This endpoint returns a paginated list of all tilesets you've created. **Pagination:** - Use `limit` to control how many tilesets to return (1-100) - Use `offset` to skip tilesets for pagination - Total count is included in response for pagination UI

- **query param** `limit`: integer [min=1, max=100] default=`50` — Maximum number of tilesets to return
- **query param** `offset`: integer [min=0] default=`0` — Number of tilesets to skip

**Resposta 200** `TilesetsListResponse`: `usage`:Usage (nullable), `tilesets`:array of TilesetSummary, `total`:integer

Erros: 401 Invalid API token

### `POST /create-tileset` — Create top-down tileset (async processing)

Creates a complete tileset for game development with seamlessly connecting tiles. A tileset is a collection of individual tiles (16 for standard, 25 for transition_size=1.0) that can be combined to create larger maps and environments. This endpoint generates tiles representing two terrain levels - "lower" and "upper" - that connect seamlessly when placed adjacent to each other. **Understanding Lower and Upper Terrain:** - **Lower terrain**: The base level terrain (e.g., water, grass, lava) - **Upper terrain**: The elevated terrain level (e.g., beach, dirt path, rock) - **Transition size**: Controls the visual height difference between levels. Larger transitions (0.25-0.5) create a more pronounced elevation effect, making it appear as if the upper terrain is on a higher plane **Using the tiles (Wang corner autotiling):** Define your terrain on a vertex grid — one terrain value ("lower"/"upper") per vertex, so a map of W×H cells has (W+1)×(H+1) vertices. Each map cell reads its 4 corner vertices (NW, NE, SW, SE) and you place the tile whose `pattern_4x4` (or `corners`) matches those…


**Corpo** (`application/json`, `CreateTilesetRequest`):

- `lower_description` **(obrigatório)**: string [minLen=1] — Description of the lower/base terrain level (e.g., 'ocean', 'grass', 'lava')
- `upper_description` **(obrigatório)**: string [minLen=1] — Description of the upper/elevated terrain level (e.g., 'sand', 'stone', 'snow')
- `transition_description`: string default=`""` — Optional description of transition area between lower and upper
- `lower_base_tile_id`: string (nullable) — Optional ID to identify the lower base tile in metadata
- `upper_base_tile_id`: string (nullable) — Optional ID to identify the upper base tile in metadata
- `tile_size`: `TileSize` default=`{"width": 16, "height": 16}` — Size of individual tiles within the tileset
- `mode`: string enum: `standard`, `pro` default=`"standard"` — Generation pipeline. "standard": the website's standard tileset (pixen, 16 or 32px tiles, round borders unless shape_style='square'), cheap and fast. "pro": the richest tiles - painted texture, raised banks -…
- `shape_style`: string enum: `square`, `round` (nullable) — Procedural boundary geometry for mode='standard'; 'round' when omitted, as on the website. mode='standard' ONLY — passing it with mode='pro' is rejected (pro's own shape controls are raggedness, roundness,…
- `enhance`: boolean default=`true` — Standard tilesets only (on by default; pro ignores it). AI-enhances the terrain descriptions at the chosen detail/shading levels and picks matching base colours before generation. The stored tileset keeps the…
- `spread_x`: number [min=0.0, max=1.0] default=`0.5` — No effect - the Pro pipeline no longer uses it; kept so existing calls work.
- `slope_size`: number [min=0.0, max=1.0] default=`0.0` — No effect - the Pro pipeline no longer uses it; kept so existing calls work.
- `raggedness`: number [min=0.0, max=1.0] default=`0.0` — Pro only. Terrain boundary noise (0=smooth, 1=rough). Tall sets (transition_size above 0.4) are half as rough.
- `roundness`: number [min=0.0, max=2.0] (nullable) — mode='pro' or shape_style only. Corner shape of the border between the two terrains: 0 = square, 1 = round, 2 = corners cut at 45 degrees (values in between blend). Above 1 needs mode='pro'. Omit for the…
- `boundary_amplitude`: number [min=0.0, max=0.3] default=`0.0` — Uneven boundary: mode='pro' (any transition_size), or standard with transition_size up to 0.5. How far the border between the terrains meanders instead of running straight, 0 = straight (default) to 0.3 = the…
- `boundary_seed`: integer [min=0.0] default=`0` — Boundary shape for boundary_amplitude: another number gives a different meander at the same amount; the same number gives the same shape.
- `step_slope`: number [min=0.0, max=2.0] default=`0.0` — Edge steepness: mode='pro' with transition_size 0.25 only (a raised 16-tile set). How the bank between the terrains falls: 0 = a cliff, straight down (default), up to 2.0 = a gentle slope spread over more…
- `connect_diagonals`: boolean default=`false` — mode='pro' only. The two diagonal tiles (upper terrain in opposite corners): true joins the two upper corners through the middle into one area; false (default) leaves the lower terrain running between them. On…
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `outline`: `Outline` (nullable) — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `shading`: `Shading` (nullable) — Shading style reference
- `detail`: `Detail` (nullable) — Detail style reference
- `view`: `TilesetCameraView` default=`"high top-down"` — Camera view angle, honoured by mode='pro'. Standard (pixen) always draws high top-down.
- `tile_strength`: number [min=0.1, max=2.0] default=`1.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `tileset_adherence_freedom`: number [min=0.0, max=900.0] default=`500.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `tileset_adherence`: number [min=0.0, max=500.0] default=`100.0` — No effect: standard runs on pixen and pro ignores it; kept so existing calls work.
- `transition_size`: number [min=0.0, max=1.0] default=`0.0` — Size of transition area. Pro accepts 0, 0.25, 0.5, or 1.0. Standard accepts any value from 0 to 1; values above 0.5 use the extended 4x8 layout, which needs 16px tiles. Pro reads it as the HEIGHT of the upper…
- `lower_reference_image`: `Base64Image` (nullable) — Reference image for lower terrain style
- `upper_reference_image`: `Base64Image` (nullable) — Reference image for upper terrain style
- `transition_reference_image`: `Base64Image` (nullable) — Reference image for transition area style
- `color_image`: `Base64Image` (nullable) — No effect on standard (pixen picks its own colours); for pro, use target_palette.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the tileset (mode='pro' only) is one…
- `seed`: integer (nullable) — Seed for reproducible generation

**Resposta 202** `CreateTilesetBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `tileset_id`:string, `status`:const processing

**Resposta 200** (application/json): ?

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `GET /tilesets/{tileset_id}` — Get generated tileset by ID

Retrieve a completed tileset by its UUID. This endpoint returns the complete tileset data including all tiles with their images, corner data and metadata. Use this after background processing completes. The tileset ID is returned immediately when you submit a tileset generation request. Check the background job status first to ensure generation is complete. Newly generated tilesets have 16 tiles (standard) or 25 (transition_size=1.0). This endpoint also serves tilesets generated by earlier versions, which may report other counts at transition_size=1.0. Always read `total_tiles` / the length of `tiles` rather than assuming a fixed count. Response includes: - All tiles with base64 PNG images - Corner classifications (NW, NE, SW, SE) for each tile — "lower", "upper", or, on transition_size=1.0 tilesets, "transition" - `pattern_4x4` per tile (0=lower, 1=upper, 2=transition, 255=wildcard). On transition_size=1.0 tilesets the 25 tiles cover only 21 distinct corner combinations, so match on `pattern_4x4` rather than `corners` alone — 4 wall-continuation tiles are distinguishable no other…

- **path param** `tileset_id` (obrigatório): string

**Resposta 200** `CreateTilesetResponse`: `usage`:Usage (nullable), `tileset`:TilesetData, `metadata`:TilesetMetadata

Erros: 423 Tileset is still being generated; 404 Tileset not found; 401 Invalid API token

### `DELETE /tilesets/{tileset_id}` — Delete a top-down tileset

Permanently delete a top-down tileset you own, plus any lingering background_jobs rows for it. Cannot be undone.

- **path param** `tileset_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteTilesetResponse`: `usage`:Usage (nullable), `success`:boolean, `tileset_id`:string (nullable), `error`:string (nullable)

Erros: 401 Invalid API token; 403 Tileset belongs to another user; 404 Tileset not found

### `POST /tilesets-sidescroller` — Create a sidescroller tileset · alias of /create-tileset-sidescroller

Creates a sidescroller platform tileset in the background and returns immediately with job ID. Retrieve results with GET /tilesets/{tileset_id}.


**Corpo** (`application/json`, `CreateTilesetSidescrollerRequest`):

- `lower_description` **(obrigatório)**: string [minLen=1] — Description of the main terrain/platform material (e.g., 'stone bricks', 'grass ground', 'metal grating')
- `transition_description`: string default=`""` — Optional description of decorative layer on top of platform (e.g., 'moss and vines', 'snow cover', 'rust stains')
- `lower_base_tile_id`: string (nullable) — Optional ID to identify the lower base tile in metadata (for connected tilesets)
- `tile_size`: `SidescrollerTileSize` default=`{"width": 16, "height": 16}` — Size of individual tiles within the tileset
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8.0` — How closely to follow the text descriptions (default: 8.0)
- `outline`: `Outline` (nullable) — Outline style reference
- `shading`: `Shading` (nullable) — Shading style reference
- `detail`: `Detail` (nullable) — Detail style reference
- `tile_strength`: number [min=0.1, max=2.0] default=`1.0` — Strength of tile pattern adherence
- `tileset_adherence_freedom`: number [min=0.0, max=900.0] default=`500.0` — How flexible it will be when following tileset structure, higher values means more flexibility
- `tileset_adherence`: number [min=0.0, max=500.0] default=`100.0` — How much it will follow the reference/texture image and follow tileset structure
- `transition_size`: number enum: `0.0`, `0.25`, `0.5`, `1.0` default=`0.0` — Size of transition area (0 = no transition, 0.25 = quarter tile, 0.5 = half tile, 1.0 = full tile)
- `lower_reference_image`: `Base64Image` (nullable) — Reference image for platform terrain style
- `transition_reference_image`: `Base64Image` (nullable) — Reference image for transition area style
- `color_image`: `Base64Image` (nullable) — Reference image for color palette
- `seed`: integer (nullable) — Seed for reproducible generation

**Resposta 202** `CreateTilesetBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `tileset_id`:string, `status`:const processing

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `GET /tilesets-sidescroller` — List your sidescroller tilesets

List all sidescroller tilesets created by the authenticated user, most recent first. Paginated via limit/offset. `total` reflects the full count, not the page size.

- **query param** `limit`: integer [min=1, max=50] default=`10`
- **query param** `offset`: integer [min=0] default=`0`

**Resposta 200** `SidescrollerTilesetsListResponse`: `usage`:Usage (nullable), `tilesets`:array of SidescrollerTilesetSummary, `total`:integer

Erros: 401 Invalid API token

### `POST /create-tileset-sidescroller` — Create sidescroller tileset (async processing)

Creates a complete sidescroller tileset for 2D platformer game development. A sidescroller tileset is a collection of individual tiles designed for side-view platformer games. The tiles represent floating platforms with transparent backgrounds, allowing them to be placed over any game background. **Key differences from top-down tilesets:** - **View**: Always "side" perspective (fixed, cannot be changed) - **Background**: Always transparent (no background terrain) - **Use case**: 2D platformer games, side-scrolling adventures - **No slopes**: Only flat horizontal platform surfaces **Understanding the layers:** - **Lower terrain**: The main platform/ground material (e.g., stone, grass, metal) - **Transition**: Optional decorative layer on top of the platform (e.g., moss, snow, rust) - **Background**: Automatically transparent (not configurable) Features: - Returns individual tiles with unique IDs - Transparent background for easy overlay on game scenes - Tile sizes: 16x16 or 32x32 pixels - Seamless tile connections for platform creation - Optional transition layer for surface details…


**Corpo** (`application/json`, `CreateTilesetSidescrollerRequest`):

- `lower_description` **(obrigatório)**: string [minLen=1] — Description of the main terrain/platform material (e.g., 'stone bricks', 'grass ground', 'metal grating')
- `transition_description`: string default=`""` — Optional description of decorative layer on top of platform (e.g., 'moss and vines', 'snow cover', 'rust stains')
- `lower_base_tile_id`: string (nullable) — Optional ID to identify the lower base tile in metadata (for connected tilesets)
- `tile_size`: `SidescrollerTileSize` default=`{"width": 16, "height": 16}` — Size of individual tiles within the tileset
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8.0` — How closely to follow the text descriptions (default: 8.0)
- `outline`: `Outline` (nullable) — Outline style reference
- `shading`: `Shading` (nullable) — Shading style reference
- `detail`: `Detail` (nullable) — Detail style reference
- `tile_strength`: number [min=0.1, max=2.0] default=`1.0` — Strength of tile pattern adherence
- `tileset_adherence_freedom`: number [min=0.0, max=900.0] default=`500.0` — How flexible it will be when following tileset structure, higher values means more flexibility
- `tileset_adherence`: number [min=0.0, max=500.0] default=`100.0` — How much it will follow the reference/texture image and follow tileset structure
- `transition_size`: number enum: `0.0`, `0.25`, `0.5`, `1.0` default=`0.0` — Size of transition area (0 = no transition, 0.25 = quarter tile, 0.5 = half tile, 1.0 = full tile)
- `lower_reference_image`: `Base64Image` (nullable) — Reference image for platform terrain style
- `transition_reference_image`: `Base64Image` (nullable) — Reference image for transition area style
- `color_image`: `Base64Image` (nullable) — Reference image for color palette
- `seed`: integer (nullable) — Seed for reproducible generation

**Resposta 202** `CreateTilesetBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `tileset_id`:string, `status`:const processing

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `DELETE /tilesets-sidescroller/{tileset_id}` — Delete a sidescroller tileset

Permanently delete a sidescroller tileset you own, plus any lingering background_jobs rows scoped to the sidescroller model. Cannot be undone.

- **path param** `tileset_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteSidescrollerTilesetResponse`: `usage`:Usage (nullable), `success`:boolean, `tileset_id`:string (nullable), `error`:string (nullable)

Erros: 401 Invalid API token; 403 Tileset belongs to another user; 404 Tileset not found

### `GET /tilesets-sidescroller/{tileset_id}` — Get a sidescroller tileset by ID

Retrieve a completed sidescroller tileset by UUID. Returns 423 while still generating (with Retry-After header), 404 if the tileset doesn't exist or is a topdown tileset (use GET /v2/tilesets/{tileset_id} for those).

- **path param** `tileset_id` (obrigatório): string

**Resposta 200** (application/json): ?

Erros: 401 Invalid API token; 404 Sidescroller tileset not found; 423 Still being generated; see Retry-After header

---

## Tiles


### `POST /create-tiles-pro` — Create tiles pro (async processing)

Creates pixel art tiles based on the provided parameters. Generates multiple tile variations by drawing tile shape outlines and having AI fill them with pixel art — or, with `tile_feature`, a connectable set: - **`tile_feature: "roads"`** — an 18-configuration path/road autotile set (square_topdown, isometric) - **`tile_feature: "tileset"`** — a terrain-transition Wang set: 16 corner tiles for square_topdown/isometric/oblique, a 32-tile coastline for hex/hex_pointy; describe it as a transition ("grass to water") - **`tile_feature: "building"`** — a construction kit: floor, connectable wall segments, doorways, pillar and staircase (square_topdown, isometric, oblique; see the `building_*` parameters) - omit `tile_feature` for independent tile variations Supported tile types: - **hex**: Flat-top hexagonal tiles - **hex_pointy**: Pointy-top hexagonal tiles - **isometric**: Diamond/rhombus tiles - **oblique**: Square top with sheared depth — connectable sets only (`tile_feature` tileset or building; see `oblique_lean`) - **octagon**: 8-sided polygon tiles - **square_topdown**: Square…


**Corpo** (`application/json`, `CreateTilesProRequest`):

- `description` **(obrigatório)**: string — Text description of the tiles. For best control, number each tile variation: '1). grass tile 2). stone tile 3). lava tile'.
- `tile_type`: string enum: `hex`, `hex_pointy`, `isometric`, `oblique`, `octagon`, `square_topdown` default=`"isometric"` — Shape of the tiles. hex: flat-top hexagonal, hex_pointy: pointy-top hexagonal, isometric: diamond/rhombus, oblique: true square top with the depth extruded diagonally down-right at 45 degrees (tileset/building…
- `tile_size`: integer [min=16.0, max=128.0] default=`32` — Tile size in pixels (16-128). 32px is recommended for most use cases. Connectable sets (tile_feature) have tighter per-shape ranges; square top-down roads are exactly 32.
- `tile_height`: integer [min=16.0, max=256.0] (nullable) — Tile height in pixels for non-square tiles (e.g., 128 for 64x128 tiles). When omitted, height is computed from tile_type geometry and view angle.
- `tile_view`: string enum: `top-down`, `high top-down`, `low top-down`, `side` default=`"low top-down"` — View angle controlling tile depth. top-down: no depth, high top-down: ~15%, low top-down: ~30%, side: ~50%.
- `tile_view_angle`: number [min=0.0, max=90.0] (nullable) — Continuous view angle in degrees (0-90). Overrides tile_view when provided. 0=side, 90=top-down.
- `tile_depth_ratio`: number [min=0.0, max=1.0] (nullable) — Tile depth/thickness ratio (0.0-1.0). Controls how much vertical depth the tile has. Overrides the default computed from tile_view.
- `tile_flat_top_px`: integer [min=2.0, max=8.0] (nullable) — Isometric top/bottom cap width: 2px classic or 4px modern. Only used when tile_type='isometric'.
- `outline_mode`: string enum: `outline`, `segmentation` default=`"outline"` — Tile guide style. outline: gray shading with outlines. segmentation: color zones without outlines, giving cleaner seamless edges.
- `tile_feature`: string enum: `roads`, `tileset`, `building` (nullable) — Generate a connectable set instead of independent tiles. roads: 18-config path autotiles (square_topdown, isometric). tileset: terrain transition — a 16-tile corner set for square_topdown/isometric/oblique, or…
- `building_wall_tiles`: integer [min=1.0, max=3.0] (nullable) — Building kits: wall height in tiles (1-3). Defaults to 2.
- `building_layout`: string enum: `grid`, `materials` (nullable) — Building kits: grid paints each shaped piece individually (richer, isometric default); materials paints flat swatches and renders pieces from them (more consistent, default for square_topdown/oblique).
- `building_wall_description`: string [maxLen=500] (nullable) — Building kits: wall material, e.g. 'stone brick walls'. More reliable than relying on the description being split.
- `building_floor_description`: string [maxLen=500] (nullable) — Building kits: floor material, e.g. 'wooden plank floor'.
- `building_floor2_description`: string [maxLen=500] (nullable) — Building kits: upper-storey/roof surface. Defaults to the wall material.
- `building_wall_angle`: number [min=5.0, max=90.0] (nullable) — Building kits, square_topdown only: wall storey height as its own camera angle, decoupled from the ground pitch.
- `oblique_lean`: number [min=0.0, max=1.0] (nullable) — Oblique tilesets and building walls: horizontal shear per pixel of height. 0.5 is classic cabinet (~27 degrees), 1.0 is a full 45 degree diagonal (default for oblique).
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `style_images`: array of `TilesProStyleImage` (nullable) — Style reference tiles. When provided, generated tiles will match these tiles' style and dimensions. The tile_type, tile_size, tile_view, tile_view_angle, and tile_depth_ratio are ignored — the style tiles…
- `style_options`: `TilesProStyleOptions` (nullable) — Options for what to copy from the style images. Only used when style_images is provided.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every tile is one of them; max_colors…

**Resposta 202** `CreateTilesProBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `tile_id`:string, `status`:const processing

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `GET /tiles-pro/{tile_id}` — Get generated tiles pro by ID

Retrieve completed tiles pro by their UUID. This endpoint returns the tile images after background processing completes. Use this after the tile generation is finished. The tile ID is returned immediately when you submit a tile generation request. Response includes: - List of base64 PNG tile variation images - Usage information Example usage:

- **path param** `tile_id` (obrigatório): string

**Resposta 200** `GetTilesProResponse`: `usage`:Usage (nullable), `storage_urls`:object, `kind`:string, `tile_rules`:object (nullable)

Erros: 404 Tiles not found; 401 Invalid API token; 423 Tiles still processing

### `DELETE /tiles-pro/{tile_id}` — Delete a tiles-pro tile

Permanently delete a tiles-pro tile you own. Blocked while the tile is still generating (status=pending, created <15 min ago) — wait for completion via GET /v2/tiles-pro/{tile_id} first. Once the job passes the stuck threshold, deletion is allowed.

- **path param** `tile_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteTilesProResponse`: `usage`:Usage (nullable), `success`:boolean, `tile_id`:string (nullable), `error`:string (nullable)

Erros: 401 Invalid API token; 403 Tile belongs to another user; 404 Tile not found; 409 Tile is still generating

### `GET /tiles-pro` — List your tiles-pro tiles

List all tiles-pro tiles created by the authenticated user, most recent first. Paginated via limit/offset. `total` reflects the full count, not the page size.

- **query param** `limit`: integer [min=1, max=50] default=`10`
- **query param** `offset`: integer [min=0] default=`0`

**Resposta 200** `TilesProListResponse`: `usage`:Usage (nullable), `tiles`:array of TilesProSummary, `total`:integer

Erros: 401 Invalid API token

### `POST /create-isometric-tile` — Create isometric tile (async processing)

Creates a isometric tile based on the provided parameters. Supported image size: - Minimum area 16x16 and maximum area 64x64 - Sizes above 24x24 often produce better quality results Supported features: - Init image - Forced palette


**Corpo** (`application/json`, `CreateIsometricTileRequest`):

- `description` **(obrigatório)**: string — Text description of the image to generate
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_isometric_tile__ImageSize`
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8` — How closely to follow the text description
- `outline`: string enum: `single color outline`, `selective outline`, `lineless` (nullable) default=`"lineless"` — Outline style for the tile
- `shading`: string enum: `flat shading`, `basic shading`, `medium shading`, `detailed shading`, `highly detailed shading` (nullable) default=`"basic shading"` — Shading complexity
- `detail`: string enum: `low detail`, `medium detail`, `highly detailed` (nullable) default=`"medium detail"` — Level of detail in the tile
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of the initial image influence
- `isometric_tile_size`: integer enum: `16`, `32` (nullable) default=`16` — Size of the isometric tile. Recommended sizes: 16, 32. Can be omitted for default.
- `isometric_tile_shape`: string enum: `thick tile`, `thin tile`, `block` default=`"block"` — Tile thickness. Thicker tiles allow more height variation in game maps. thin tile: ~15% canvas height, thick tile: ~25% height, block: ~50% height
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `seed`: integer (nullable) — Seed decides the starting noise

**Resposta 202** `CreateIsometricTileBackgroundResponse`: `usage`:Usage (nullable), `background_job_id`:string, `tile_id`:string, `status`:const processing

**Resposta 200** (application/json): ?

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests; 529 Rate limit exceeded

### `GET /isometric-tiles/{tile_id}` — Get generated isometric tile by ID

Retrieve a completed isometric tile by its UUID. This endpoint returns the isometric tile image after background processing completes. Use this after the tile generation is finished. The tile ID is returned immediately when you submit a tile generation request. Check the background job status first to ensure generation is complete. Response includes: - Base64 PNG image with transparent background - Usage information Example usage:

- **path param** `tile_id` (obrigatório): string

**Resposta 200** `CreateIsometricTileResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 404 Tile not found; 401 Invalid API token; 423 Tile still processing

### `DELETE /isometric-tiles/{tile_id}` — Delete an isometric tile

Permanently delete an isometric tile you own. Cannot be undone.

- **path param** `tile_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteIsometricTileResponse`: `usage`:Usage (nullable), `success`:boolean, `tile_id`:string (nullable), `error`:string (nullable)

Erros: 401 Invalid API token; 403 Tile belongs to another user; 404 Tile not found

### `GET /isometric-tiles` — List user's isometric tiles

List all isometric tiles created by the authenticated user. This endpoint returns a paginated list of all isometric tiles you've created. **Pagination:** - Use `limit` to control how many tiles to return (1-100) - Use `offset` to skip tiles for pagination - Total count is included in response for pagination UI

- **query param** `limit`: integer [min=1, max=100] default=`50` — Maximum number of tiles to return
- **query param** `offset`: integer [min=0] default=`0` — Number of tiles to skip

**Resposta 200** `IsometricTilesListResponse`: `usage`:Usage (nullable), `tiles`:array of IsometricTileSummary, `total`:integer

Erros: 401 Invalid API token

---

## Map Objects


### `POST /map-objects` — Create map object

Creates a pixel art object with transparent background for game maps. Returns immediately with job ID. Processing takes ~15-30 seconds.


**Corpo** (`application/json`, `CreateMapObjectRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Object description (e.g., 'wooden barrel', 'stone fountain')
- `image_size`: `app__endpoints__external__v2__create_map_object__ImageSize` default=`{"width": 128, "height": 128}` — Object dimensions
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"high top-down"` — Camera angle
- `outline`: string enum: `single color outline`, `selective outline`, `lineless` (nullable) default=`"single color outline"` — Outline style
- `shading`: string enum: `flat shading`, `basic shading`, `medium shading`, `detailed shading` (nullable) default=`"medium shading"` — Shading complexity
- `detail`: string enum: `low detail`, `medium detail`, `high detail` (nullable) default=`"medium detail"` — Level of detail
- `text_guidance_scale`: number [min=1.0, max=20.0] default=`8.0` — How closely to follow the description
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: integer [min=1.0, max=999.0] default=`300` — Strength of initial image influence
- `color_image`: `Base64Image` (nullable) — Image containing colors for forced palette
- `background_image`: `Base64Image` (nullable) — Background/map image for style matching. Required when using inpainting.
- `inpainting`: `MaskInpainting` | `OvalInpainting` | `RectangleInpainting` (nullable) — Inpainting configuration for style matching. Options: mask (custom), oval (auto-generated), rectangle (auto-generated)
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation

**Resposta 200** `CreateMapObjectResponse`: `usage`:Usage (nullable), `background_job_id`:string, `object_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `GET /map-objects/{object_id}` — Get map object status + metadata

Poll a map object's status. Returns: - 200 with metadata + download_url when completed - 423 Locked with Retry-After header while still generating - 410 Gone with a hint when generation failed permanently - 404 when no job for this user+object_id exists Map objects auto-delete 8h after creation — grab the PNG promptly.

- **path param** `object_id` (obrigatório): string

**Resposta 200** `GetMapObjectResponse`: `usage`:Usage (nullable), `status`:string, `object_id`:string, `description`:string (nullable), `width`:integer (nullable), `height`:integer (nullable), `view`:string (nullable), `created_at`:string (nullable), `download_url`:string (nullable)

Erros: 401 Invalid API token; 404 Object not found; 410 Object generation failed permanently; 423 Still generating; see Retry-After header

---

## Game UI


### `POST /create-ui-asset` — Create UI panel (Pro)

Generate a shape-based pixel-art UI panel from a text description. Returns immediately with a `background_job_id` and `ui_asset_id`. Poll `GET /v2/ui-assets/{ui_asset_id}` until `status` is `completed`, then read `image_url`. Provide `pieces` to control the panel shape (editor view coords: longer side 512, shorter side aspect-scaled); omit it for a default full-canvas rounded-rect panel.


**Corpo** (`application/json`, `CreateUIAssetRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Style description for the UI panel (e.g. 'wooden RPG panel with gold trim')
- `image_size`: `app__endpoints__external__v2__create_ui_asset__ImageSize` — Output image size in pixels (192–688; max per axis depends on aspect)
- `pieces`: array of `UiPieceRect` | `UiPieceCircle` | `UiPiecePolygon` (nullable) — Optional shape template (validated). Each piece needs a unique `id`, a `kind`, and an optional `label`. Allowed kinds: rounded_rect {x,y,w,h,radius}, circle {x,y,r}, polygon {x,y,r,sides,phase}. Coords are on…
- `elements`: array of string (nullable) — Optional named UI element types to scaffold the panel from (auto-positioned, no coords needed). Available: button, icon_button, toolbar, tab, panel, window, health_bar, avatar, triangle, pentagon, hexagon,…
- `style_image`: `Base64Image` (nullable) — Optional style reference image (PNG/JPEG base64)
- `color_palette`: string [maxLen=200] (nullable) — Optional palette specification (e.g. 'brown and gold')
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the image is one of them; max_colors…
- `no_background`: boolean default=`true` — Remove background after generation
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `name`: string (nullable) — Friendly name for the saved asset
- `project_id`: string (nullable) — If set, assign the finished asset to this project

**Resposta 202** `CreateUIAssetResponse`: `usage`:Usage (nullable), `background_job_id`:string, `ui_asset_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /generate-ui-v2` — Generate UI (Pro)

Generate pixel art UI elements from text description. This endpoint creates pixel art UI elements such as buttons, health bars, inventory slots, dialogue boxes, and other game interface components. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve results. **Key Features:** - Text-to-image UI generation - Optional concept image for design guidance - Optional color palette specification - Automatic background removal - Optimized for game UI assets - Non-blocking: returns job ID immediately **Supported Sizes:** - Minimum 16x16. Maximum depends on aspect ratio (e.g. 512x512 for square, 688x384 for 16:9). **Example Descriptions:** - "medieval stone button with gold trim" - "sci-fi health bar with neon glow" - "wooden inventory slot with metal corners" - "pixel art dialogue box with decorative border" **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, images are in `last_response`


**Corpo** (`application/json`, `GenerateUIV2Request`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of the UI element to generate (e.g., 'medieval stone button', 'sci-fi health bar')
- `image_size`: `app__endpoints__external__v2__generate_ui_v2__ImageSize` — Output image size (16 to aspect-ratio max, e.g. 512x512 square)
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation
- `no_background`: boolean (nullable) default=`true` — Remove background from generated UI element
- `concept_image`: `ConceptImage` (nullable) — Optional concept image to guide the UI design
- `color_palette`: string [maxLen=200] (nullable) — Optional color palette specification (e.g., 'brown and gold', 'blue and silver')
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of every image is one of them; max_colors…

**Resposta 202** `GenerateUIV2Response`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `GET /ui-assets` — List UI assets

List the authenticated user's UI panels (newest first). Includes ghost rows for jobs still generating.

- **query param** `limit`: integer [min=1, max=100] default=`50`
- **query param** `offset`: integer [min=0] default=`0`

**Resposta 200** `UIAssetsListResponse`: `usage`:Usage (nullable), `ui_assets`:array of UIAssetSummary, `total`:integer

Erros: 401 Invalid API token

### `GET /ui-assets/{ui_asset_id}` — Get UI asset

Get a UI panel's details. Reports progress while the panel is still generating.

- **path param** `ui_asset_id` (obrigatório): string (uuid)

**Resposta 200** `UIAssetDetail`: `id`:string, `name`:string (nullable), `prompt`:string, `size`:UIAssetSize, `image_url`:string (nullable), `status`:string (nullable), `created_at`:string, `progress_percent`:integer (nullable), `eta_seconds`:integer (nullable)

Erros: 401 Invalid API token; 404 UI asset not found

### `DELETE /ui-assets/{ui_asset_id}` — Delete UI asset

Permanently delete a UI panel and its backing image files.

- **path param** `ui_asset_id` (obrigatório): string (uuid)

**Resposta 200** `DeleteUIAssetResponse`: `usage`:Usage (nullable), `success`:boolean

Erros: 401 Invalid API token; 404 UI asset not found

---

## Portraits & Voice


### `POST /portrait-character-pro` — Portrait ↔ character (Pro)

Convert between a bust portrait and a full-body character sprite. Pick the conversion with `direction`: - `portrait_to_character`: a bust portrait in → a full-body character sprite out. - `character_to_portrait`: a full-body character in → a bust portrait out. The output preserves the subject's identity/outfit while matching an internal size-specific pixel-art style. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}` to check status and retrieve the result image. **Supported Sizes:** 16, 32, 48, 64, 128, 160 px (128/160 are drawn with extra detail). **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. When `status` is `completed`, the sprite is in `last_response.images[0]`


**Corpo** (`application/json`, `PortraitCharacterProRequest`):

- `direction`: string enum: `portrait_to_character`, `character_to_portrait` default=`"portrait_to_character"` — portrait_to_character: input is a bust portrait, output a full-body character sprite. character_to_portrait: input is a full-body character, output a bust portrait.
- `image` **(obrigatório)**: `Base64Image` — Input image as base64 PNG/JPEG (a portrait or a character, matching `direction`).
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"` — Camera angle of the character.
- `result_size`: integer enum: `16`, `32`, `48`, `64`, `128`, `160` default=`64` — Output sprite size in pixels. 128/160 are drawn with extra detail and cost more generations.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation.
- `target_palette`: `TargetPalette` (nullable) — Colours the result must use and/or a colour cap: {"colors": ["#081820", "#346856", "#88c070", "#e0f8d0"], "name": "Game Boy", "max_colors": 4}. With colors every pixel of the sprite is one of them; max_colors…

**Resposta 202** `PortraitCharacterProResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 400 No internal style for this size/view; 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `GET /portrait-character-pro/{job_id}` — Get portrait ↔ character job status + result

- **path param** `job_id` (obrigatório): string

**Resposta 200** `GetPortraitCharacterResponse`: `usage`:Usage (nullable), `status`:string, `job_id`:string, `width`:integer (nullable), `height`:integer (nullable), `seed`:integer (nullable), `download_url`:string (nullable)

Erros: 401 Invalid API token; 404 Job not found; 410 Generation failed permanently; 423 Still processing; see Retry-After header

### `POST /characters/{character_id}/portrait` — Set a character's portrait

Attach a bust portrait to a character. Free — no generation runs. A portrait is the starting frame for talking animations: `POST /v2/vocal-animation` generates the mouth positions from it. Overwrites any existing portrait. To generate a portrait from a full-body sprite first, use `POST /v2/portrait-character-pro` with `direction="character_to_portrait"`.

- **path param** `character_id` (obrigatório): string

**Corpo** (`application/json`, `SetPortraitRequest`):

- `image` **(obrigatório)**: `Base64Image` — Portrait as base64 PNG/JPEG, 16-256px. A non-square image is centred on a transparent square canvas.

**Resposta 200** `SetPortraitResponse`: `usage`:Usage (nullable), `character_id`:string, `size`:integer, `url`:string

Erros: 401 Invalid API token; 404 Character not found

### `POST /vocal-animation` — Generate talking mouth positions for a portrait

Generate the set of mouth positions ("visemes") that lets a portrait be lip-synced to any line of text. This is the only step that costs generations, and you pay it once per expression. Turning the result into talking animations with `POST /v2/talking-gif` is free and unlimited. Provide **either**: - `character_id` — generates from that character's stored portrait and saves the set onto it, so `/v2/talking-gif` only needs the character id afterwards. - `portrait` — generates from the image you supply and stores nothing; the mouth positions come back inline from the GET below for you to keep. Call once per expression (`mood`). `viseme_count` must match across expressions on one character. **Requires a paid plan.** **Usage pattern:** 1. POST here (returns `background_job_id`) 2. Poll `GET /v2/vocal-animation/{background_job_id}` every 10-15 seconds 3. When `status` is `completed`, either the set is on your character, or the frames are in `visemes`


**Corpo** (`application/json`, `VocalAnimationRequest`):

- `character_id`: string (nullable) — Generate from this character's stored portrait and save the result onto it. Required if you want to use `character_id` with /v2/talking-gif. Mutually exclusive with `portrait`.
- `portrait`: `Base64Image` (nullable) — Generate from this image instead and store nothing — the mouth positions come back inline. Max 256x256. Mutually exclusive with `character_id`.
- `mood`: string enum: `neutral`, `happy`, `angry`, `sad`, `surprised` default=`"neutral"` — Expression held on the face throughout. The mouth positions are the same across moods; call once per expression you want.
- `viseme_count`: integer enum: `3`, `5`, `7`, `12` default=`7` — How many mouth positions to generate. 3 for tiny portraits, 7 recommended, 12 for large close-ups. Must be the same for every expression on one character.
- `no_background`: boolean default=`true` — Return frames with a transparent background.
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation.

**Resposta 202** `VocalAnimationResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string, `mood`:string, `viseme_count`:integer

Erros: 400 Character has no portrait, or viseme_count mismatch; 401 Invalid API token; 402 Insufficient resources; 403 Requires a paid plan; 404 Character not found; 429 Too many concurrent jobs

### `GET /vocal-animation/{job_id}` — Get mouth-position job status + result

Poll a `/v2/vocal-animation` job. Mouth positions stream in as they are produced, so `completed_visemes` fills up while the job runs. On completion, a `character_id` job has saved the set onto the character; a `portrait` job returns the frames in `visemes`.

- **path param** `job_id` (obrigatório): string

**Resposta 200** `GetVocalAnimationResponse`: `usage`:Usage (nullable), `status`:string, `job_id`:string, `mood`:string, `viseme_count`:integer, `character_id`:string (nullable), `completed_visemes`:array of string, `visemes`:object (nullable), `moods_on_character`:array of string (nullable), `grid_url`:string (nullable), `viseme_order`:array of string (nullable)

Erros: 401 Invalid API token; 404 Job not found; 410 Generation failed

### `POST /talking-gif` — Lip-sync text to a talking GIF (free)

Turn a line of text into an animated GIF of the character speaking it. **Free** — this spends no generations. It only re-orders mouth positions that `POST /v2/vocal-animation` already produced, so the cost lands once per expression and every line of dialogue after that is free. Returns immediately; there is no job to poll. Provide **either** `character_id` (plus an optional `mood`) to use the positions stored on a character, **or** `visemes` to pass them in directly. Mouth shapes come from the letters of `text`, so any latin-alphabet language works.


**Corpo** (`application/json`, `TalkingGifRequest`):

- `text` **(obrigatório)**: string [maxLen=500] — The line of dialogue to lip-sync. Mouth shapes are derived from the letters, so any language using the latin alphabet works.
- `character_id`: string (nullable) — Use the mouth positions stored on this character. Mutually exclusive with `visemes`.
- `mood`: string enum: `neutral`, `happy`, `angry`, `sad`, `surprised` (nullable) — Which stored expression to talk with. Defaults to the character's first. Only valid with `character_id`.
- `visemes`: object (nullable) — Supply the mouth positions directly, as returned by GET /v2/vocal-animation/{job_id}. Mutually exclusive with `character_id`.
- `frame_ms`: integer [min=20.0, max=500.0] default=`90` — Milliseconds per mouth position.
- `hold_ms`: integer [min=0.0, max=5000.0] default=`600` — Pause held on the closed mouth at the end, so a looping GIF has a beat between takes.

**Resposta 200** `TalkingGifResponse`: `usage`:Usage (nullable), `gif_base64`:string, `frames`:integer, `duration_ms`:integer, `frame_ms`:integer, `hold_ms`:integer, `width`:integer, `height`:integer, `mood`:string (nullable)

Erros: 400 Character has no mouth positions, or unknown mood; 401 Invalid API token; 404 Character not found

### `POST /lip-sync` — Get the lip-sync frame plan for text (free)

Return the frame-by-frame plan for speaking a line — which mouth position to show, for how long, and how far through the text it lands. **Free**, and nothing is rendered: use this instead of `/v2/talking-gif` when you are animating in a game engine and want to drive the mouth yourself rather than play a GIF. With `character_id` the response also carries `grid_url`, `row` and `viseme_order`, which is everything needed to blit the right cell: column comes from each frame, row from the chosen expression. Timings are exact here — unlike a GIF, an engine can hold a frame for any duration.


**Corpo** (`application/json`, `LipSyncRequest`):

- `text` **(obrigatório)**: string [maxLen=500] — The line of dialogue to lip-sync.
- `character_id`: string (nullable) — Use the mouth positions stored on this character; the response then also carries the spritesheet URL and the row to read. Mutually exclusive with `viseme_count`.
- `mood`: string enum: `neutral`, `happy`, `angry`, `sad`, `surprised` (nullable) — Which stored expression to use. Defaults to the character's first. Only valid with `character_id`.
- `viseme_count`: integer enum: `3`, `5`, `7`, `12` (nullable) — Plan against a preset without touching a character — useful if you hold the frames yourself. Mutually exclusive with `character_id`.
- `frame_ms`: integer [min=1.0, max=5000.0] default=`90` — Milliseconds to hold each mouth position.
- `hold_ms`: integer [min=0.0, max=10000.0] default=`600` — Extra time on the final closed mouth.

**Resposta 200** `LipSyncResponse`: `usage`:Usage (nullable), `text`:string, `total_ms`:integer, `viseme_order`:array of string, `frames`:array of LipSyncFrameOut, `mood`:string (nullable), `grid_url`:string (nullable), `row`:integer (nullable), `rows`:integer (nullable)

Erros: 400 Character has no mouth positions, or unknown mood; 401 Invalid API token; 404 Character not found

---

## Fonts


### `POST /generate-font-pro` — Generate pixel font (Pro)

Generate a styled pixel-art font from a text description. Produces an 80-glyph atlas plus a ready-to-use TrueType (`.ttf`) font with A-Z, a-z, digits 0-9, and common game-UI punctuation. Returns immediately with a background job ID. Poll `GET /v2/background-jobs/{job_id}`; when `status` is `completed`, `last_response` contains `images[0]` (the glyph atlas PNG) and `ttf_base64` (the font file as base64). **Price:** 15 subscription generations or at least $0.115 in credits. `glyph_px` 8/16/32/64 is the native bitmap size per glyph. **Usage Pattern:** 1. POST to this endpoint (returns `background_job_id`) 2. Poll `GET /v2/background-jobs/{background_job_id}` every 5-10 seconds 3. On `completed`: decode `ttf_base64` to a `.ttf`; `images[0]` is the atlas


**Corpo** (`application/json`, `GenerateFontProRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Style description, e.g. 'warm orange arcade font'.
- `weight` **(obrigatório)**: string enum: `Bold`, `Regular` — Stroke weight. Guides glyph thickness.
- `glyph_px`: integer enum: `8`, `16`, `32`, `64` default=`16` — Native glyph resolution in pixels (the real bitmap size per glyph in the output atlas/TTF).
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation.
- `font_name`: string [maxLen=200] (nullable) — Explicit font family name; defaults to '{description} {weight}'.

**Resposta 202** `GenerateFontProResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `GET /generate-font-pro/{job_id}` — Get font-pro job status + result

- **path param** `job_id` (obrigatório): string

**Resposta 200** `GetFontResponse`: `usage`:Usage (nullable), `status`:string, `job_id`:string, `glyph_px`:integer (nullable), `download_atlas_url`:string (nullable), `download_ttf_url`:string (nullable)

Erros: 401 Invalid API token; 404 Job not found; 410 Generation failed permanently; 423 Still processing; see Retry-After header

---

## Cleanup


### `POST /unzoom` — Unzoom pixel art

Recover native-resolution pixel art from an upscaled image. Pixel art posted online is almost always scaled up — a 32x32 sprite saved at 512x512. Feeding that to a generation endpoint as a reference wastes detail and confuses the models, because every art pixel is a 16x16 block. This endpoint detects the underlying pixel grid and downsamples back onto it, so you get the 32x32 sprite the artist actually drew. Use it before sending user-supplied artwork to `create-image-bitforge`, `image-to-pixelart` or any endpoint taking a style/reference image. Constraints: - Minimum 256x256 — grid detection needs enough pixels to find the lattice - Maximum area 2048x2048 - **The result is opaque.** Grid detection works in RGB, so any transparency in the input is composited onto WHITE first. Run `/remove-background` on the result if you need the sprite cut out again. The grid does not have to be uniform: images with slightly uneven pixel sizes (from a lossy resize) are handled.


**Corpo** (`application/json`, `UnzoomRequest`):

- `image` **(obrigatório)**: `Base64Image` — The upscaled pixel art image to unzoom (PNG or JPEG base64)
- `quantize`: integer [min=-1.0, max=256.0] default=`0` — Palette handling for the result. 0 auto-detects a palette, -1 keeps every color the downsample produces, and 2-256 quantizes to exactly that many colors.

**Resposta 200** `UnzoomResponse`: `usage`:Usage (nullable), `image`:Base64Image, `original_size`:Size, `unzoomed_size`:Size, `zoom_factor_detected`:number

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /correct-pixelart` — Correct pixel art

Clean up and refine existing pixel art without changing its size. Sharpens edges, removes stray and anti-aliased pixels, and tightens the palette while keeping the sprite on its existing pixel grid. Useful on art that has been through a lossy pipeline, hand-drawn art that needs tidying, or output from another tool that is nearly-but-not-quite on-grid. This does NOT resize. If your image is an upscaled sprite (each art pixel is a block of screen pixels), run `/unzoom` first to get back to the native grid, then correct. - Maximum area 1024x1024 - Transparency is preserved — the alpha channel is carried around the model and re-applied to the result - `strength` 0.0-1.0: start at 0.1 and raise it only if the art needs real repair


**Corpo** (`application/json`, `CorrectPixelartRequest`):

- `images` **(obrigatório)**: array of `Base64Image` [minItems=1] — Pixel art image(s) to clean up (PNG base64). Several frames are corrected together and must all be the same size — pass an animation's frames or a character's directions in one call so they stay consistent…
- `strength`: number [min=0.0, max=1.0] default=`0.1` — How far the model may move from your art. Low values tidy stray pixels and edges; high values redraw more aggressively and can change details.

**Resposta 200** `CorrectPixelartResponse`: `usage`:Usage (nullable), `images`:array of Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /reduce-colors` — Reduce colors

Quantize images onto a smaller, shared palette. Pixel art reads as pixel art partly because of its restricted palette. AI output and converted artwork often carry hundreds of near-identical colors; this snaps them onto a tight palette, optionally with ordered dithering. Passing several frames in one call is the point of the endpoint: they are quantized together, so an animation or a character's eight directions come back sharing ONE palette instead of drifting apart frame by frame. Three ways to choose the palette: - omit `num_colors` and `palette_image` — the palette size is auto-detected - `num_colors` — quantize to exactly this many colors - `palette_image` — reuse the colors of an existing image (your game's palette) Total size limit across all frames is 512x512 worth of pixels (e.g. sixteen 64x64 frames, or four 128x128).


**Corpo** (`application/json`, `ReduceColorsRequest`):

- `images` **(obrigatório)**: array of `Base64Image` [minItems=1] — Image(s) to quantize (PNG base64). Several frames are quantized together onto ONE shared palette and must all be the same size — pass an animation's frames or a character's directions in one call so their…
- `num_colors`: integer [min=2.0, max=256.0] (nullable) — Target number of colors. Omit to auto-detect a good palette size from the image itself. Mutually exclusive with palette_image.
- `palette_image`: `Base64Image` (nullable) — An image whose colors become the palette (max 256 colors). Use it to force frames onto an existing game palette. Mutually exclusive with num_colors.
- `dithering`: string enum: `none`, `2x2`, `4x4`, `8x8` default=`"none"` — Ordered dithering matrix size. Larger matrices give smoother gradients at the cost of a busier look.
- `dithering_strength`: number [min=0.0, max=10.0] default=`5.0` — How strongly to dither. Ignored when dithering is 'none'.

**Resposta 200** `ReduceColorsResponse`: `usage`:Usage (nullable), `images`:array of Base64Image, `palette`:Base64Image, `n_colors`:integer

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /remove-background` — Remove background

Remove the background from a pixel art image, producing a transparent PNG. Supported image size: - Maximum area 400x400 **Background Removal Tasks:** - `remove_simple_background` (default) — Faster, works well for simple/solid backgrounds - `remove_complex_background` — Slower, better for complex edges and detailed backgrounds **Optional text hint:** Provide a description of the foreground object to improve accuracy.


**Corpo** (`application/json`, `RemoveBackgroundRequest`):

- `image` **(obrigatório)**: `Base64Image` — The image to remove the background from (PNG or JPEG base64)
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__remove_background__ImageSize` — Size of the input image
- `background_removal_task`: string enum: `remove_simple_background`, `remove_complex_background` default=`"remove_simple_background"` — Background removal complexity. 'remove_simple_background' is faster, 'remove_complex_background' handles complex edges better
- `text`: string [maxLen=500] (nullable) — Optional description of the foreground object to help with removal
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation

**Resposta 200** `RemoveBackgroundResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

### `POST /normal-map` — Normal map

Make the normal map of a sprite, so a game engine can light it. The map is a PNG the sprite's size: RGB = which way each pixel faces (red right, green up in the `opengl` convention, blue toward the viewer), alpha 255 wherever the sprite shows and 0 elsewhere. Each part of the sprite gets its own 3D shape, so a moving light shades it like a model. An animation is sent and returned as a horizontal strip, one map per frame, made from one plan so the light stays steady. ### Pro or Lite `mode` `pro` plans each part of the picture: its shape, what is in front, what is sunk (cracks, gaps). `lite` makes the map from the art alone in about a second, for less. ### Look `kind` says what the picture is: `character`, `object`, `topdown`, `side` (a side view: sidescroller tiles, a landscape), `iso` (isometric) or `ui`. Left out, it is read from the picture; set it for sidescroller, isometric and UI art, which are easy to mistake for something else. `strength`, `outline_rounding`, `part_shapes`, `surface_detail` and `detail_softness` tune the map: how far it bends light, how much the outline and…


**Corpo** (`application/json`, `NormalMapRequest`):

- `image` **(obrigatório)**: `Base64Image` — The sprite as base64 PNG, 8 to 512 px per side. An animation is a horizontal strip of `frames` equal frames.
- `frames`: integer [min=1.0] default=`1` — How many frames the image's strip holds (up to 32). Planned once, on the first frame, and carried to the others; the map comes back as a strip.
- `convention`: string enum: `opengl`, `directx` default=`"opengl"` — opengl: green = up (Godot, Unity, Phaser); directx: green = down (Unreal).
- `mode`: string enum: `lite`, `pro` default=`"lite"` — lite (0.1 generation, recommended): from the art alone, in about a second, and almost always as good; set kind with it for isometric, sidescroller and UI art. pro (0.5 generation): each part of the picture is…
- `kind`: string enum: `character`, `object`, `topdown`, `side`, `iso`, `ui` (nullable) — What the picture is: character (a character, creature or portrait), object (an item or effect), topdown (a map, scene or tileset seen from above), side (a side view: sidescroller tiles, a landscape), iso…
- `strength`: number [min=0.0, max=2.0] (nullable) — How far every pixel tilts away from facing the viewer.
- `outline_rounding`: number [min=0.0, max=3.0] (nullable) — How much the outline rounds off: 0 keeps it flat to the edge.
- `part_shapes`: number [min=0.0, max=2.0] (nullable) — How much the sprite's 3D parts (a round head, a cylinder of an arm) add: higher for a rounder body.
- `surface_detail`: number [min=0.0, max=2.0] (nullable) — The art's own light and dark as bumps: painted chunks bulge, dark lines and cracks sink. 0 for smooth.
- `detail_softness`: number [min=0.6, max=3.0] (nullable) — How much that detail is blurred, in px: low follows every pixel, high only the big shapes.

**Resposta 202** `NormalMapResponse`: `usage`:Usage (nullable), `background_job_id`:string, `status`:string

Erros: 400 Image outside the supported sizes; 401 Invalid API token; 402 Insufficient credits; 429 Too many concurrent jobs

### `POST /resize` — Resize pixel art image

Intelligently resize pixel art images while maintaining pixel art aesthetics. Supported image sizes: - Minimum area 16x16 and maximum area 200x200 (both source and target) Supported features: - Init image - Forced palette - Transparent background **Best practices:** - For best results, resize iteratively in small steps - Recommended: At most 50% decrease or 2x increase per resize - Example: 32x32 → 64x64 (2x) is good, 32x32 → 128x128 (4x) should be done in two steps


**Corpo** (`application/json`, `ResizeRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — Description of your character
- `reference_image` **(obrigatório)**: `Base64Image` — Image to resize
- `reference_image_size` **(obrigatório)**: `app__endpoints__external__v2__resize__ImageSize` — Original size of the reference image
- `target_size` **(obrigatório)**: `app__endpoints__external__v2__resize__ImageSize` — Desired output size
- `view`: `CameraView` (nullable) — Camera view angle
- `direction`: `Direction` (nullable) — Directional view
- `isometric`: boolean (nullable) default=`false` — Isometric perspective
- `oblique_projection`: boolean (nullable) default=`false` — Oblique projection (beta)
- `no_background`: boolean (nullable) default=`false` — Remove background
- `color_image`: `Base64Image` (nullable) — Forced color palette, image containing colors used for palette
- `init_image`: `Base64Image` (nullable) — Initial image to start from
- `init_image_strength`: number [min=0.0, max=999.0] (nullable) default=`150.0` — Strength of initial image influence
- `seed`: integer [min=0.0] (nullable) — Seed for reproducible generation

**Resposta 200** `ResizeResponse`: `usage`:Usage (nullable), `image`:Base64Image

Erros: 400 Invalid image size constraints; 401 Invalid API token; 402 Insufficient credits; 429 Too many requests

---

## Enhance Prompt


### `POST /enhance-pixen-prompt` — Enhance pixen prompt

Enhance a Pixen image description. Returns a more detailed, model-friendly prompt that produces better results when passed to `/v2/create-image-pixen`. The enhanced description scales detail to `image_size` (small images get short focused prompts, large images get rich detail) and respects `outline`, `detail`, `view`, `direction`, and `no_background`.


**Corpo** (`application/json`, `EnhancePixenPromptRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — User's image description to enhance.
- `image_size` **(obrigatório)**: `app__endpoints__external__v2__create_image_pixen__ImageSize` — Target image size. Prompt complexity scales with size.
- `outline`: `Outline` (nullable) — Outline style hint.
- `detail`: `Detail` (nullable) default=`"highly detailed"` — Detail level hint.
- `view`: `CameraView` (nullable) — Camera view angle.
- `direction`: `Direction` (nullable) — Subject direction the enhanced description should describe.
- `no_background`: boolean default=`false` — If true, the enhanced description will describe the subject on a plain background (no scene).

**Resposta 200** `EnhancePixenPromptResponse`: `usage`:Usage (nullable), `enhanced_prompt`:string

Erros: 401 Invalid API token; 402 Insufficient credits

### `POST /enhance-character-v3-prompt` — Enhance character v3 prompt

Enhance a v3 character description. Returns a more detailed, model-friendly prompt for `/v2/create-character-v3`. The enhanced description never mentions facing direction (v3 rotates south-facing into 8 directions automatically) and never describes a background (v3 always renders transparent).


**Corpo** (`application/json`, `EnhanceCharacterV3PromptRequest`):

- `description` **(obrigatório)**: string [minLen=1, maxLen=2000] — User's character description to enhance.
- `image_size` **(obrigatório)**: `V3OutputImageSize` — Target frame size. Prompt complexity scales with size.
- `view`: string enum: `low top-down`, `high top-down`, `side` default=`"low top-down"` — Camera view / tilt.
- `outline`: string (nullable) — Outline style hint (soft guidance — same as create-character-v3).
- `detail`: string (nullable) — Detail level hint (soft guidance — same as create-character-v3).

**Resposta 200** `EnhanceCharacterV3PromptResponse`: `usage`:Usage (nullable), `enhanced_prompt`:string

Erros: 401 Invalid API token; 402 Insufficient credits

### `POST /enhance-animation-v3-prompt` — Enhance animation v3 prompt

Enhance an animation action description. Returns a richer motion description suitable for use as the `action` field of `/v2/animate-with-text-v3`, or — with `engine: "pixminimax"` — as the `description` of `/v2/animate-pixminimax` (send the sprite's facing to that route as `direction`); `/v2/animate-pixminimax` can also do this step for you with `enhance_prompt: true`. Two modes: - **Single-frame mode** (default): provide only `first_frame`. The enhanced prompt describes how the visible subject animates from that pose. - **Interpolation mode**: also provide `last_frame`. The enhanced prompt describes the motion that smoothly transitions between the two poses. The enhanced description is grounded in the visible image content (pose, props, orientation, clothing) and does not introduce camera moves, cuts, or new objects unless explicitly requested.


**Corpo** (`application/json`, `EnhanceAnimationV3PromptRequest`):

- `first_frame` **(obrigatório)**: `Base64Image` — First frame as base64 PNG/JPEG. Becomes the basis of the motion description.
- `last_frame`: `Base64Image` (nullable) — Optional end frame. When provided, the enhanced prompt describes the interpolated motion between first_frame and last_frame.
- `action` **(obrigatório)**: string [minLen=1, maxLen=500] — User's action description (e.g., 'walking', 'jumping', 'sword swing').
- `engine`: string enum: `v3`, `pixminimax`, `skeleton-v3` default=`"v3"` — Which animation model the prompt is written for: 'v3' (animate-with-text-v3, default), 'pixminimax' (animate-pixminimax) or 'skeleton-v3' (animate-with-skeleton-v3). PixMiniMax gets its action caption only:…
- `direction`: string enum: `south`, `north`, `east`, `west`, `south-east`, `south-west`, `north-east`, `north-west` (nullable) — Accepted but not used: PixMiniMax's facing is its own field, `direction` on /v2/animate-pixminimax.
- `frame_count`: integer [min=1.0, max=40.0] (nullable) — Frames the animation will have. Used by pixminimax prompts to judge how many motion beats fit.

**Resposta 200** `EnhanceAnimationV3PromptResponse`: `usage`:Usage (nullable), `enhanced_prompt`:string

Erros: 401 Invalid API token; 402 Insufficient credits

---

## Image to Text


### `POST /image-to-text` — Image to text

Describe an image, or ask anything about it. Send one `image` and get `text` back. Two modes: - **Describe** (default): omit `prompt`. Returns a 1–3 sentence image-generation prompt covering subject, pose, notable details, style, lighting, camera angle and background — ready to paste into a `description` field of a create endpoint. - **Ask**: set `prompt` to your own instruction or question. It replaces the default instruction, so include everything you want the answer to follow (length, format, what to focus on). The default instruction is: > You are an expert prompt engineer for image generation. Describe the image in 1–3 sentences as an image-generation prompt. Include: subject, pose, notable details, style, lighting, camera angle, background. Avoid speculation about sensitive attributes. Keep it concise. **Cost:** a small fraction of a generation — typically around 0.09 for a sprite or screenshot, more for a long answer. The exact amount is returned in `usage`. Small pixel art is enlarged (whole-number nearest-neighbour) before it is read. When the image has transparency, the…


**Corpo** (`application/json`, `ImageToTextRequest`):

- `image` **(obrigatório)**: `Base64Image` — Image to read, as base64 PNG/JPEG (or a data: URI). Any size up to 4096x4096; small pixel art is fine.
- `prompt`: string [minLen=1, maxLen=2000] (nullable) — Your own instruction or question about the image, e.g. 'List the colors of the character's outfit' or 'Describe this as a 10-word pixel art prompt'. Replaces the default instruction entirely. Omit it to get a…

**Resposta 200** `ImageToTextResponse`: `usage`:Usage (nullable), `text`:string

Erros: 401 Invalid API token; 402 Insufficient credits; 503 Temporarily unavailable upstream; retry

---

## Jobs


### `GET /background-jobs/{job_id}` — Get background job status

Check the status and results of a background job. This endpoint allows you to monitor the progress of background operations like character creation and animation generation. Background jobs are used for expensive operations that take time to complete. **Job Statuses:** - `processing` - Job is currently running - `completed` - Job finished successfully - `failed` - Job encountered an error **Usage Pattern:** 1. Create a character or animation (returns `background_job_id`) 2. Poll this endpoint periodically to check status 3. When status is `completed`, access results in `last_response` **Response Data:** - For character creation: `character_id`, `directions_count`, character info - For animations: `animation_id`, `frame_count`, animation details - Storage information and file organization details **Authentication:** Requires a valid API token. You can only access jobs you created. **Error Handling:** - 404: Job not found or doesn't belong to you - Jobs are automatically cleaned up after completion **Polling Recommendations:** - Poll every 5-10 seconds while status is `processing` -…

- **path param** `job_id` (obrigatório): string

**Resposta 200** `BackgroundJobResponse`: `usage`:Usage (nullable), `id`:string, `status`:string, `created_at`:string, `last_response`:object (nullable)

Erros: 401 Invalid API token; 404 Job not found or doesn't belong to user; 429 Too many requests

### `DELETE /background-jobs/{job_id}` — Cancel a background job

Cancel a background job that is still `processing`. - Frees your concurrency slot immediately, so you can submit new work. - A job still waiting in the queue is removed and not charged. Billing only covers work a GPU actually did, so a generation that is already running may still finish and be charged. - A job you resubmit starts at the back of the queue. While a job is `processing`, `last_response.queue_position` and `last_response.estimated_wait_seconds` (from GET `/v2/background-jobs/{job_id}`) show that it is waiting for a GPU. A waiting job is not stuck, and cancelling it to resubmit makes the wait longer.

- **path param** `job_id` (obrigatório): string

**Resposta 200** `CancelBackgroundJobResponse`: `usage`:Usage (nullable), `id`:string, `status`:string, `message`:string

Erros: 400 Job already completed or failed; nothing to cancel; 409 Job completed while the cancel was being applied; 401 Invalid API token; 404 Job not found or doesn't belong to user

---

## Account


### `GET /balance` — Get balance

Returns the current balance for your account, including both USD credits and remaining subscription generations.


**Resposta 200** `BalanceResponse`: `credits`:Credits, `subscription`:Subscription

Erros: 401 Invalid API token

---

## Uploads


### `POST /uploads` — Upload an image to reference from other tools

Store an image for 3 days and return the reference tools accept. Free: no generation runs, so nothing is charged.


**Corpo** (`multipart/form-data`, `Body_create_upload_uploads_post`):

- `file` **(obrigatório)**: string — PNG, JPEG or any image Pillow reads

**Resposta 200** `UploadedImage`: `ref`:string, `upload_id`:string (uuid), `width`:integer, `height`:integer, `n_frames`:integer, `expires_in_days`:integer

### `POST /uploads/{ticket}` — Upload an image with an upload URL from the MCP tool

Same upload, authorised by the URL instead of a bearer token. For agents that hold an MCP connection but cannot read its token: the MCP tool `get_upload_url` returns a URL that works here for 15 minutes. The ticket only uploads, and only as the user it was issued to.

- **path param** `ticket` (obrigatório): string

**Corpo** (`multipart/form-data`, `Body_create_upload_with_ticket_uploads__ticket__post`):

- `file` **(obrigatório)**: string — PNG, JPEG or any image Pillow reads

**Resposta 200** `UploadedImage`: `ref`:string, `upload_id`:string (uuid), `width`:integer, `height`:integer, `n_frames`:integer, `expires_in_days`:integer

---

## Documentation


### `GET /llms.txt` — Get LLM-friendly API documentation

Returns a curated index of the API for Large Language Models (LLMs), following the llms.txt standard (https://llmstxt.org). It provides a short overview plus links to the OpenAPI spec, interactive docs, SDKs, and guides — where the full endpoint and parameter detail lives. ## Usage You can reference this documentation in AI prompts: - `@api.pixellab.ai/v2/llms.txt` in Claude - Direct URL access for other tools


**Resposta 200** (text/plain): string

---

## Tipos comuns


### `AnimationGroup`

- `animation_type` **(obrigatório)**: string — Template animation ID (e.g. 'walk', 'run')
- `display_name`: string (nullable) — Custom display name if set
- `animation_group_id`: string (nullable) — ID of this animation. Every direction of it shares this id, and it is what the PixelLab website groups animations by. Use it to delete the animation ([DELETE…
- `directions` **(obrigatório)**: array of `AnimationDirection`

### `Base64Image`

A base64 encoded image. Attributes: type (Literal["base64"]): Always "base64" to indicate the image encoding type base64 (str): The base64 encoded image data format (str): The image format (e.g., "png", "jpeg")

- `type`: const `base64` default=`"base64"` — Image data type
- `base64` **(obrigatório)**: string — Base64 encoded image data
- `format`: string default=`"png"` — Image format

### `BoundingBox`

Bounding box to mark the editing area on the context image.

- `x` **(obrigatório)**: integer [min=0.0] — X coordinate of the bounding box
- `y` **(obrigatório)**: integer [min=0.0] — Y coordinate of the bounding box
- `width` **(obrigatório)**: integer [min=1.0] — Width of the bounding box
- `height` **(obrigatório)**: integer [min=1.0] — Height of the bounding box

### `CameraView`

- enum: `side`, `low top-down`, `high top-down`

### `CharacterProportions`

Character proportions with individual control.

- `type`: const `custom` default=`"custom"` — Proportion type identifier
- `head_size`: number [min=0.5, max=2.0] default=`1.0` — Head size multiplier (recommended max: 1.7)
- `arms_length`: number [min=0.5, max=2.0] default=`1.0` — Arm length multiplier
- `legs_length`: number [min=0.5, max=2.0] default=`1.0` — Leg length multiplier
- `shoulder_width`: number [min=0.5, max=2.0] default=`1.0` — Shoulder width multiplier
- `hip_width`: number [min=0.5, max=2.0] default=`1.0` — Hip width multiplier

### `CharacterProportionsPreset`

Preset character proportions.

- `type`: const `preset` default=`"preset"` — Proportion type identifier
- `name`: string enum: `default`, `chibi`, `cartoon`, `stylized`, `realistic_male`, `realistic_female`, `heroic` default=`"default"` — Pre-defined character proportions

### `CharacterRotationUrls`

URLs for character rotation images

- `south` **(obrigatório)**: string — URL for south-facing rotation
- `west` **(obrigatório)**: string — URL for west-facing rotation
- `east` **(obrigatório)**: string — URL for east-facing rotation
- `north` **(obrigatório)**: string — URL for north-facing rotation
- `south-east`: string (nullable) — URL for south-east rotation (8-dir only)
- `north-east`: string (nullable) — URL for north-east rotation (8-dir only)
- `north-west`: string (nullable) — URL for north-west rotation (8-dir only)
- `south-west`: string (nullable) — URL for south-west rotation (8-dir only)

### `CharacterSize`

Character sprite dimensions

- `width` **(obrigatório)**: integer — Image width in pixels
- `height` **(obrigatório)**: integer — Image height in pixels

### `CharacterSummary`

Summary of a character for listing

- `id` **(obrigatório)**: string — Unique character identifier
- `name` **(obrigatório)**: string — Character name (shared by all sibling states in the group)
- `state_name`: string (nullable) — Name of this state within the character (e.g. 'Idle', 'wearing red armor')
- `prompt` **(obrigatório)**: string — Character creation prompt
- `size` **(obrigatório)**: `CharacterSize` — Character image dimensions
- `directions` **(obrigatório)**: integer — Number of directional rotations (4 or 8)
- `created_at` **(obrigatório)**: string — ISO timestamp of character creation
- `updated_at`: string (nullable) — ISO timestamp of the last edit. Compare it (or the ?t= stamp on the returned URLs) against your copy to sync only what changed.
- `animation_count` **(obrigatório)**: integer — Number of animations for this character
- `template_id` **(obrigatório)**: string — Template used for character creation
- `view`: string (nullable) — Camera view angle used
- `status`: string default=`"completed"` — Generation status: 'completed', 'failed', or 'pending'. Only 'completed' characters have a preview_url.
- `preview_url`: string (nullable) — Public URL to the south direction sprite (null unless status == 'completed')
- `tags`: array of string — User-defined tags for filtering
- `group_id`: string (nullable) — Shared ID grouping sibling state characters (None if not part of a group)

### `ConceptImage`

Optional concept image for UI generation guidance.

- `image` **(obrigatório)**: `Base64Image` — Concept image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__generate_ui_v2__ReferenceImageSize` — Size of the concept image

### `Credits`

USD credit balance

- `type`: const `usd` default=`"usd"`
- `usd` **(obrigatório)**: number — USD credit balance

### `Detail`

- enum: `low detail`, `medium detail`, `highly detailed`

### `Direction`

- enum: `north`, `north-east`, `east`, `south-east`, `south`, `south-west`, `west`, `north-west`

### `DirectionSubmission`

- `direction` **(obrigatório)**: string
- `status` **(obrigatório)**: string enum: `queued`, `rate_limited`
- `background_job_id`: string (nullable)
- `animation_id`: string (nullable)

### `EditImage`

An image to edit with its dimensions.

- `image` **(obrigatório)**: `Base64Image` — Image to edit as base64 PNG/JPEG
- `width` **(obrigatório)**: integer [min=1.0, max=512.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=1.0, max=512.0] — Image height in pixels

### `FrameSize`

A canvas size in pixels. Both sides must be multiples of 4, 32–256.

- `width` **(obrigatório)**: integer [min=32.0, max=256.0]
- `height` **(obrigatório)**: integer [min=32.0, max=256.0]

### `InpaintImage`

Image with size for inpainting.

- `image` **(obrigatório)**: `Base64Image` — Image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__inpaint_v3__ImageSize` — Size of the image

### `IsometricTileSummary`

Summary of an isometric tile for listing

- `id` **(obrigatório)**: string — Unique tile identifier
- `name`: string (nullable) — Tile name
- `description` **(obrigatório)**: string — Tile description
- `size`: integer (nullable) — Tile size in pixels
- `tile_shape`: string (nullable) — Tile shape (thin tile, thick tile, block)
- `created_at` **(obrigatório)**: string — ISO timestamp of tile creation
- `status` **(obrigatório)**: string — Generation status: completed, processing, or failed

### `KeyframeImage`

Keyframe image for interpolation.

- `image` **(obrigatório)**: `Base64Image` — Keyframe image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__interpolation_v2__FrameImageSize` — Size of the keyframe image

### `Keypoint-Input`

One joint of a skeleton.

- `x` **(obrigatório)**: number [min=0.0, max=1.0] — Horizontal position, 0-1 across the image
- `y` **(obrigatório)**: number [min=0.0, max=1.0] — Vertical position, 0-1 down the image
- `label` **(obrigatório)**: `SkeletonLabel`
- `z_index`: integer default=`0` — Draw order; higher draws on top
- `depth`: number [min=0.0, max=255.0] (nullable) — How near the camera this joint is, 0-255 (about 128 at the body's centre, higher is nearer). Optional: leave it out and it is taken from the standing pose of `template_id` for this direction, which…

### `Keypoint-Output`

- `x` **(obrigatório)**: number
- `y` **(obrigatório)**: number
- `label` **(obrigatório)**: string
- `z_index` **(obrigatório)**: number

### `LipSyncFrameOut`

- `viseme` **(obrigatório)**: string — Mouth position id.
- `column` **(obrigatório)**: integer — Column of this mouth position in the spritesheet.
- `duration_ms` **(obrigatório)**: integer — How long to hold this frame.
- `text_offset` **(obrigatório)**: integer — Characters of `text` spoken by the end of this frame — drive a karaoke-style highlight from it.

### `MaskInpainting`

Manual mask image for precise control

- `type`: const `mask` default=`"mask"`
- `mask_image` **(obrigatório)**: `Base64Image` — Mask image: black (0,0,0)=frozen context, white (255,255,255)=generate area

### `ObjectAnimationGroup`

An animation grouped across one or more directions, keyed by animation_group_id. Legacy rows that share an animation_name but lack a group_id are bucketed by name and surfaced here too — the animation_group_id field will be the backfilled UUID after migration 005 runs.

- `animation_group_id` **(obrigatório)**: string — UUID of the animation group — pass back to extend via POST /v2/objects/{id}/animations
- `display_name`: string (nullable) — User-visible label
- `description` **(obrigatório)**: string — Animation prompt from the latest row in the group
- `frame_count` **(obrigatório)**: integer — Frame count from the latest row in the group
- `directions` **(obrigatório)**: array of `ObjectAnimationDirection` — One entry per distinct direction (deduped by MAX(created_at))

### `ObjectRotationUrls`

URLs for object rotation images. Populated for multi-direction objects (directions in {4, 8}). For 1-direction objects all keys are null — see `storage_urls['unknown']`.

- `south`: string (nullable) — URL for south-facing rotation
- `west`: string (nullable) — URL for west-facing rotation
- `east`: string (nullable) — URL for east-facing rotation
- `north`: string (nullable) — URL for north-facing rotation
- `south-east`: string (nullable) — URL for south-east rotation (8-dir only)
- `south-west`: string (nullable) — URL for south-west rotation (8-dir only)
- `north-east`: string (nullable) — URL for north-east rotation (8-dir only)
- `north-west`: string (nullable) — URL for north-west rotation (8-dir only)

### `ObjectSize`

Object sprite dimensions

- `width` **(obrigatório)**: integer — Image width in pixels
- `height` **(obrigatório)**: integer — Image height in pixels

### `ObjectSummary`

Summary of an object for listing

- `id` **(obrigatório)**: string — Unique object identifier
- `name`: string (nullable) — Object name (shared by all sibling states in the group)
- `state_name`: string (nullable) — Name of this state within the object (e.g. 'base', 'add moss')
- `prompt` **(obrigatório)**: string — Object creation prompt
- `size` **(obrigatório)**: `ObjectSize` — Object image dimensions
- `directions` **(obrigatório)**: integer — Number of directional rotations (1, 4, or 8)
- `created_at` **(obrigatório)**: string — ISO timestamp of object creation
- `view`: string (nullable) — Camera view angle used
- `preview_url`: string (nullable) — Public URL to the south direction sprite (or unknown for 1-direction objects)
- `tags`: array of string — User-defined tags for filtering
- `status`: string (nullable) — Object status (pending, completed, failed)

### `Outline`

- enum: `single color black outline`, `single color outline`, `selective outline`, `lineless`

### `OutputSize`

Output dimensions

- `width` **(obrigatório)**: integer [min=16.0, max=512.0] — Width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=512.0] — Height in pixels

### `OvalInpainting`

Automatic oval/ellipse mask generation

- `type`: const `oval` default=`"oval"`
- `fraction`: number [min=0.05, max=0.95] default=`0.3` — Size of oval as fraction of background (0.05-0.95). E.g., 0.3 = oval covers 30% of background

### `Point`

- `x` **(obrigatório)**: number
- `y` **(obrigatório)**: number
- `label` **(obrigatório)**: `SkeletonLabel`
- `z_index`: integer default=`0`

### `ProFlashBoundingBox`

The native source rectangle within the additional context image.

- `x` **(obrigatório)**: integer [min=0.0]
- `y` **(obrigatório)**: integer [min=0.0]
- `width` **(obrigatório)**: integer [>=0.0]
- `height` **(obrigatório)**: integer [>=0.0]

### `ProFlashImageSize`

Native dimensions checked against the operation's canvas contract.

- `width` **(obrigatório)**: integer [>=0.0]
- `height` **(obrigatório)**: integer [>=0.0]

### `ProFlashReferenceImage`

Encoded image with native dimensions and its subject/style instructions.

- `image` **(obrigatório)**: `Base64Image`
- `size` **(obrigatório)**: `ProFlashImageSize`
- `usage_description`: string (nullable)

### `ProFlashStyleOptions`

Choose which visual traits to copy from the style image.

- `color_palette`: boolean default=`true`
- `outline`: boolean default=`true`
- `detail`: boolean default=`true`
- `shading`: boolean default=`true`

### `ProImageSize`

- `width` **(obrigatório)**: integer [min=32.0, max=168.0] — Output frame width in pixels (32-168).
- `height` **(obrigatório)**: integer [min=32.0, max=168.0] — Output frame height in pixels (32-168).

### `RectangleInpainting`

Automatic rectangular mask generation

- `type`: const `rectangle` default=`"rectangle"`
- `fraction`: number [min=0.05, max=0.95] default=`0.3` — Size of rectangle as fraction of background (0.05-0.95). E.g., 0.5 = rectangle covers 50% of background

### `Shading`

- enum: `flat shading`, `basic shading`, `medium shading`, `detailed shading`, `highly detailed shading`

### `SidescrollerTileSize`

- `width`: integer enum: `16`, `32` default=`16` — Individual tile width in pixels (16 or 32)
- `height`: integer enum: `16`, `32` default=`16` — Individual tile height in pixels (16 or 32)

### `SidescrollerTilesetSummary`

- `id` **(obrigatório)**: string
- `name` **(obrigatório)**: string (nullable)
- `lower_description` **(obrigatório)**: string (nullable)
- `transition_description` **(obrigatório)**: string (nullable)
- `tile_size` **(obrigatório)**: object
- `created_at` **(obrigatório)**: string
- `status` **(obrigatório)**: string

### `Size`

- `width` **(obrigatório)**: integer — Width in pixels
- `height` **(obrigatório)**: integer — Height in pixels

### `StyleImage`

Style reference image with dimensions.

- `image` **(obrigatório)**: `Base64Image` — Style image as base64 PNG/JPEG
- `width` **(obrigatório)**: integer [min=1.0, max=512.0] — Image width in pixels (max 512, matches model)
- `height` **(obrigatório)**: integer [min=1.0, max=512.0] — Image height in pixels (max 512, matches model)

### `StyleOptions`

Options for what to copy from the style image.

- `color_palette`: boolean default=`true` — Copy color palette from style image
- `outline`: boolean default=`true` — Copy outline style
- `detail`: boolean default=`true` — Copy detail level
- `shading`: boolean default=`true` — Copy shading style

### `StyleReferenceImage`

- `type`: const `base64` default=`"base64"` — Image data type
- `base64` **(obrigatório)**: string — Base64 encoded image data
- `format`: string default=`"png"` — Image format

### `Subscription`

Subscription generation balance

- `type`: const `generations` default=`"generations"`
- `status` **(obrigatório)**: string — Subscription status: active, trial, expired, or none. Team (enterprise) members get enterprise, or expired once their team's plan has ended.
- `plan`: string (nullable) — Subscription plan name
- `generations` **(obrigatório)**: number — Remaining generations this billing period
- `total` **(obrigatório)**: number — Total generations from subscription

### `TargetPalette`

Colours the result must use (colors) and/or at most max_colors per image.

- `colors`: array of string (nullable) — 2 to 256 hex colours like '#1a2b3c'.
- `name`: string [maxLen=100] (nullable) — The palette's name ('Game Boy', 'PICO-8'); helps the look.
- `max_colors`: integer [min=2.0, max=64.0] (nullable) — At most this many colours in each image (from colors if given).
- `smart`: boolean default=`false` — Beta, single images only: put each object on the palette as a whole (a face stays skin-coloured, wood stays brown) instead of giving every pixel its nearest colour. Needs colors; adds about 15-60 s.

### `TileSize`

- `width`: integer enum: `16`, `32`, `64` default=`16` — Individual tile width in pixels. 16 or 32 for standard; 64 requires mode='pro'.
- `height`: integer enum: `16`, `32`, `64` default=`16` — Individual tile height in pixels. 16 or 32 for standard; 64 requires mode='pro'.

### `TilesProStyleImage`

A style reference image with its dimensions.

- `base64` **(obrigatório)**: string — Base64-encoded RGBA image data
- `width` **(obrigatório)**: integer [min=1.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=1.0] — Image height in pixels

### `TilesProStyleOptions`

Options for what to copy from the style images.

- `color_palette`: boolean default=`true` — Match color palette from style tiles
- `outline`: boolean default=`true` — Match outline style from style tiles
- `detail`: boolean default=`true` — Match detail level from style tiles
- `shading`: boolean default=`true` — Match shading style from style tiles

### `TilesProSummary`

- `id` **(obrigatório)**: string
- `name` **(obrigatório)**: string (nullable)
- `description` **(obrigatório)**: string (nullable)
- `tile_type` **(obrigatório)**: string
- `tile_size` **(obrigatório)**: integer (nullable)
- `n_tiles` **(obrigatório)**: integer (nullable)
- `tile_view` **(obrigatório)**: string (nullable)
- `created_at` **(obrigatório)**: string
- `status` **(obrigatório)**: string

### `TilesetCameraView`

Camera view options supported for tileset generation

- enum: `low top-down`, `high top-down`

### `TilesetData`

Tileset containing individual tiles

- `total_tiles` **(obrigatório)**: integer — Total number of tiles in the tileset (16 for standard, 25 for transition_size=1.0)
- `tile_size` **(obrigatório)**: object — Size of each individual tile in pixels
- `terrain_types` **(obrigatório)**: array of string — Available terrain types
- `tiles` **(obrigatório)**: array of `Tile` — List of individual tiles with metadata

### `TilesetMetadata`

Metadata about the tileset generation

- `edge_types` **(obrigatório)**: array of string — Available edge/terrain types
- `terrain_prompts` **(obrigatório)**: object — Prompts used for each terrain type
- `terrain_ids`: object (nullable) — Optional IDs for terrain types
- `transition_size` **(obrigatório)**: number — Size of transition area between terrains
- `view` **(obrigatório)**: string — Camera view angle used for tileset
- `generation_parameters` **(obrigatório)**: object — Parameters used for AI generation
- `created_at` **(obrigatório)**: string — ISO timestamp when tileset was created

### `TilesetSummary`

Summary of a tileset for listing

- `id` **(obrigatório)**: string — Unique tileset identifier
- `name`: string (nullable) — Tileset name
- `lower_description` **(obrigatório)**: string — Lower/base terrain description
- `upper_description` **(obrigatório)**: string — Upper/elevated terrain description
- `tile_size`: object (nullable) — Tile dimensions
- `view`: string (nullable) — Camera view angle used
- `created_at` **(obrigatório)**: string — ISO timestamp of tileset creation
- `status` **(obrigatório)**: string — Generation status: completed, processing, or failed

### `UIAssetSize`

- `width` **(obrigatório)**: integer — Image width in pixels
- `height` **(obrigatório)**: integer — Image height in pixels

### `UIAssetSummary`

- `id` **(obrigatório)**: string — UI asset UUID
- `name`: string (nullable) — Friendly name
- `prompt` **(obrigatório)**: string — Style description used to generate the panel
- `size` **(obrigatório)**: `UIAssetSize` — Image dimensions
- `image_url`: string (nullable) — Public CDN URL of the panel (null while processing)
- `status`: string (nullable) — processing | completed | failed
- `created_at` **(obrigatório)**: string — ISO timestamp

### `UiPieceCircle`

- `id` **(obrigatório)**: string
- `kind` **(obrigatório)**: const `circle`
- `label`: string default=`""`
- `x` **(obrigatório)**: number
- `y` **(obrigatório)**: number
- `r` **(obrigatório)**: number

### `UiPiecePolygon`

Regular polygon — `sides` vertices at distance `r` from (x, y), starting from angle `phase` (radians).

- `id` **(obrigatório)**: string
- `kind` **(obrigatório)**: const `polygon`
- `label`: string default=`""`
- `x` **(obrigatório)**: number
- `y` **(obrigatório)**: number
- `r` **(obrigatório)**: number
- `sides` **(obrigatório)**: integer
- `phase`: number default=`0.0`

### `UiPieceRect`

- `id` **(obrigatório)**: string
- `kind` **(obrigatório)**: const `rounded_rect`
- `label`: string default=`""`
- `x` **(obrigatório)**: number
- `y` **(obrigatório)**: number
- `w` **(obrigatório)**: number
- `h` **(obrigatório)**: number
- `radius`: number default=`0`

### `Usage`

- `type`: string enum: `usd`, `generations` default=`"usd"`
- `usd`: number (nullable)
- `generations`: number (nullable) — Number of subscription generations charged (only set when type is 'generations')

### `V3OutputImageSize`

Requested output frame size. Reference mode uses the uploaded frame dimensions for generation, so this value is advisory. From-scratch mode sends this size to the sprite generator.

- `width` **(obrigatório)**: integer [min=32.0, max=256.0] — Frame width in pixels (32-256).
- `height` **(obrigatório)**: integer [min=32.0, max=256.0] — Frame height in pixels (32-256).

### `app__endpoints__external__v2__animate_with_skeleton__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=256.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=256.0] — Image height in pixels

### `app__endpoints__external__v2__animate_with_text__ImageSize`

- `width` **(obrigatório)**: integer [min=64.0, max=64.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=64.0, max=64.0] — Image height in pixels

### `app__endpoints__external__v2__animate_with_text_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=32.0, max=256.0] — Image width in pixels (32-256)
- `height` **(obrigatório)**: integer [min=32.0, max=256.0] — Image height in pixels (32-256)

### `app__endpoints__external__v2__animate_with_text_v2__ReferenceImageSize`

- `width` **(obrigatório)**: integer [min=32.0, max=256.0] — Reference image width in pixels (32-256)
- `height` **(obrigatório)**: integer [min=32.0, max=256.0] — Reference image height in pixels (32-256)

### `app__endpoints__external__v2__create_character_with_4_directions__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=128.0] — Character size in pixels. Canvas will be ~40% larger to make room for animations.
- `height` **(obrigatório)**: integer [min=16.0, max=128.0] — Character size in pixels. Canvas will be ~40% larger to make room for animations.

### `app__endpoints__external__v2__create_character_with_8_directions__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=128.0] — Requested character size in pixels. Standard mode expands the generation canvas; Pro mode stores rotations on a shared square canvas at least max(width, height).
- `height` **(obrigatório)**: integer [min=16.0, max=128.0] — Requested character size in pixels. Standard mode expands the generation canvas; Pro mode stores rotations on a shared square canvas at least max(width, height).

### `app__endpoints__external__v2__create_image_bitforge__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=200.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=200.0] — Image height in pixels

### `app__endpoints__external__v2__create_image_pixen__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=768.0, multipleOf=4.0] — Image width in pixels (min 16, max area 512x512, must be divisible by 4; must equal height when either side is below 32)
- `height` **(obrigatório)**: integer [min=16.0, max=768.0, multipleOf=4.0] — Image height in pixels (min 16, max area 512x512, must be divisible by 4; must equal width when either side is below 32)

### `app__endpoints__external__v2__create_image_pixflux__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=400.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=400.0] — Image height in pixels

### `app__endpoints__external__v2__create_isometric_tile__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=64.0] — Image width in pixels. Sizes above 24px often give better results.
- `height` **(obrigatório)**: integer [min=16.0, max=64.0] — Image height in pixels. Sizes above 24px often give better results.

### `app__endpoints__external__v2__create_map_object__ImageSize`

Image dimensions for map objects. Supports any aspect ratio: - Both width and height: 32px minimum, 400px maximum - Basic mode (no inpainting): max 400×400 total area (160,000 pixels) - Inpainting mode: max 192×192 total area (36,864 pixels) - Common sizes: 64×64, 128×128, 192×192, 256×128, 384×96

- `width` **(obrigatório)**: integer [min=32.0, max=400.0] — Width in pixels (32-400)
- `height` **(obrigatório)**: integer [min=32.0, max=400.0] — Height in pixels (32-400)

### `app__endpoints__external__v2__create_ui_asset__ImageSize`

- `width`: integer [min=192.0, max=688.0] default=`256` — Output width in pixels (192–688; max per axis depends on aspect — square 512, 16:9 688)
- `height`: integer [min=192.0, max=688.0] default=`256` — Output height in pixels (192–688; max per axis depends on aspect — square 512, 9:16 688)

### `app__endpoints__external__v2__edit_animation_v2__FrameImage`

Animation frame image with size. Nested `size` object matches the animation-frame v2 subfamily (transfer-outfit-v2, interpolation-v2), which share this backend family.

- `image` **(obrigatório)**: `Base64Image` — Frame image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__edit_animation_v2__FrameImageSize` — Size of the frame image

### `app__endpoints__external__v2__edit_animation_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=256.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=256.0] — Image height in pixels

### `app__endpoints__external__v2__edit_image__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=400.0] — Image width in pixels (16-400)
- `height` **(obrigatório)**: integer [min=16.0, max=400.0] — Image height in pixels (16-400)

### `app__endpoints__external__v2__edit_images_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=32.0, max=512.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=32.0, max=512.0] — Image height in pixels

### `app__endpoints__external__v2__edit_images_v2__ReferenceImage`

Reference image for edit_with_reference method.

- `image` **(obrigatório)**: `Base64Image` — Reference image as base64 PNG/JPEG
- `width` **(obrigatório)**: integer [min=1.0, max=512.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=1.0, max=512.0] — Image height in pixels

### `app__endpoints__external__v2__generate_8_rotations_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=32.0, max=168.0] — Image width (32-168 pixels, matches reference_to_8_rotations)
- `height` **(obrigatório)**: integer [min=32.0, max=168.0] — Image height (32-168 pixels, matches reference_to_8_rotations)

### `app__endpoints__external__v2__generate_8_rotations_v2__ReferenceImage`

Reference image with dimensions.

- `image` **(obrigatório)**: `Base64Image` — Reference image as base64 PNG/JPEG
- `width` **(obrigatório)**: integer [min=1.0, max=1024.0] — Image width (reference max 168, concept max 1024)
- `height` **(obrigatório)**: integer [min=1.0, max=1024.0] — Image height (reference max 168, concept max 1024)

### `app__endpoints__external__v2__generate_image_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=792.0] — Image width in pixels (16 to aspect-ratio max)
- `height` **(obrigatório)**: integer [min=16.0, max=688.0] — Image height in pixels (16 to aspect-ratio max)

### `app__endpoints__external__v2__generate_image_v2__ReferenceImage`

Reference image with size and optional description. Images larger than 1024x1024 will be downscaled. Non-square images will be padded to square with transparent pixels before processing.

- `image` **(obrigatório)**: `Base64Image` — Reference image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__generate_image_v2__ReferenceImageSize` — Size of the reference image. Images larger than 1024x1024 will be downscaled.
- `usage_description`: string [maxLen=500] (nullable) — Optional description of how this reference should be used

### `app__endpoints__external__v2__generate_ui_v2__ImageSize`

- `width`: integer [min=16.0, max=792.0] default=`256` — Image width in pixels (16 to aspect-ratio max)
- `height`: integer [min=16.0, max=688.0] default=`256` — Image height in pixels (16 to aspect-ratio max)

### `app__endpoints__external__v2__image_to_pixelart__ImageSize`

Image dimensions

- `width` **(obrigatório)**: integer [min=16.0, max=2048.0] — Width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=2048.0] — Height in pixels

### `app__endpoints__external__v2__inpaint__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=200.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=200.0] — Image height in pixels

### `app__endpoints__external__v2__interpolation_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=128.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=128.0] — Image height in pixels

### `app__endpoints__external__v2__remove_background__ImageSize`

- `width` **(obrigatório)**: integer [min=1.0, max=400.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=1.0, max=400.0] — Image height in pixels

### `app__endpoints__external__v2__resize__ImageSize`

Image dimensions

- `width` **(obrigatório)**: integer [min=16.0, max=200.0] — Width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=200.0] — Height in pixels

### `app__endpoints__external__v2__rotate__ImageSize`

- `width` **(obrigatório)**: integer [min=16.0, max=200.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=16.0, max=200.0] — Image height in pixels

### `app__endpoints__external__v2__transfer_outfit_v2__FrameImage`

Animation frame image to apply the outfit to.

- `image` **(obrigatório)**: `Base64Image` — Frame image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__transfer_outfit_v2__FrameImageSize` — Size of the frame image

### `app__endpoints__external__v2__transfer_outfit_v2__ImageSize`

- `width` **(obrigatório)**: integer [min=32.0, max=256.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=32.0, max=256.0] — Image height in pixels

### `app__endpoints__external__v2__transfer_outfit_v2__ReferenceImage`

Reference image with the outfit to transfer.

- `image` **(obrigatório)**: `Base64Image` — Reference image as base64 PNG/JPEG
- `size` **(obrigatório)**: `app__endpoints__external__v2__transfer_outfit_v2__FrameImageSize` — Size of the reference image

### `AnimationDirection`

- `direction` **(obrigatório)**: string
- `frame_count` **(obrigatório)**: integer
- `frames` **(obrigatório)**: array of string — Public URLs for each frame in order

### `ObjectAnimationDirection`

One direction within an animation group.

- `direction` **(obrigatório)**: string — Direction name (south, west, ..., unknown)
- `storage_urls`: object — Frame URLs for this direction, e.g. {"frames": ["...", ...]}
- `created_at` **(obrigatório)**: string — ISO timestamp

### `SkeletonLabel`

- enum: `NOSE`, `NECK`, `RIGHT SHOULDER`, `RIGHT ELBOW`, `RIGHT ARM`, `LEFT SHOULDER`, `LEFT ELBOW`, `LEFT ARM`, `RIGHT HIP`, `RIGHT KNEE`, `RIGHT LEG`, `LEFT HIP`, `LEFT KNEE`, `LEFT LEG`, `RIGHT EYE`, `LEFT EYE`, `RIGHT EAR`, `LEFT EAR`

### `Tile`

Individual tile with metadata

- `id` **(obrigatório)**: string — Unique identifier for this tile
- `name` **(obrigatório)**: string — Corner-based name (e.g., 'NW+SE', 'none')
- `image` **(obrigatório)**: `Base64Image` — Tile image data
- `corners` **(obrigatório)**: `TileCorners` — Terrain type for each corner
- `pattern_4x4` **(obrigatório)**: `TilePattern4x4` — 4x4 pattern for tile matching
- `original_position` **(obrigatório)**: `OriginalPosition` — Position in source grid
- `description`: string (nullable) — Human-readable description of the tile
- `connections`: `TileConnections` (nullable) — Deprecated. Null on newly generated top-down tilesets; some older tilesets still carry it. Use pattern_4x4 (or corners) to decide tile placement.

### `app__endpoints__external__v2__edit_animation_v2__FrameImageSize`

- `width` **(obrigatório)**: integer [min=1.0, max=256.0] — Frame image width
- `height` **(obrigatório)**: integer [min=1.0, max=256.0] — Frame image height

### `app__endpoints__external__v2__generate_image_v2__ReferenceImageSize`

- `width` **(obrigatório)**: integer [min=1.0] — Reference image width
- `height` **(obrigatório)**: integer [min=1.0] — Reference image height

### `app__endpoints__external__v2__generate_ui_v2__ReferenceImageSize`

- `width` **(obrigatório)**: integer [min=1.0] — Reference image width
- `height` **(obrigatório)**: integer [min=1.0] — Reference image height

### `app__endpoints__external__v2__inpaint_v3__ImageSize`

- `width` **(obrigatório)**: integer [min=1.0] — Image width in pixels
- `height` **(obrigatório)**: integer [min=1.0] — Image height in pixels

### `app__endpoints__external__v2__interpolation_v2__FrameImageSize`

- `width` **(obrigatório)**: integer [min=1.0] — Frame image width
- `height` **(obrigatório)**: integer [min=1.0] — Frame image height

### `app__endpoints__external__v2__transfer_outfit_v2__FrameImageSize`

- `width` **(obrigatório)**: integer [min=1.0, max=256.0] — Frame image width
- `height` **(obrigatório)**: integer [min=1.0, max=256.0] — Frame image height

### `OriginalPosition`

Original position in source tileset grid

- `row` **(obrigatório)**: integer — Row index in source grid
- `col` **(obrigatório)**: integer — Column index in source grid

### `TileConnections`

Deprecated. Valid tile connections in each cardinal direction.

- `north` **(obrigatório)**: array of string — IDs of tiles that can be placed above this tile
- `south` **(obrigatório)**: array of string — IDs of tiles that can be placed below this tile
- `east` **(obrigatório)**: array of string — IDs of tiles that can be placed to the right of this tile
- `west` **(obrigatório)**: array of string — IDs of tiles that can be placed to the left of this tile

### `TileCorners`

Corner terrain types for a tile

- `NW` **(obrigatório)**: string enum: `lower`, `upper`, `transition` — Northwest corner terrain type
- `NE` **(obrigatório)**: string enum: `lower`, `upper`, `transition` — Northeast corner terrain type
- `SW` **(obrigatório)**: string enum: `lower`, `upper`, `transition` — Southwest corner terrain type
- `SE` **(obrigatório)**: string enum: `lower`, `upper`, `transition` — Southeast corner terrain type

### `TilePattern4x4`

4x4 pattern for tile matching with wildcards (255=wildcard, 0=lower, 1=upper, 2=transition)

- `row_0` **(obrigatório)**: array of integer — Top row with wildcards
- `row_1` **(obrigatório)**: array of integer — Second row with NW, NE corners
- `row_2` **(obrigatório)**: array of integer — Third row with SW, SE corners
- `row_3` **(obrigatório)**: array of integer — Bottom row with wildcards
